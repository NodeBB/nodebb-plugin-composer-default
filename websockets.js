'use strict';

const _ = require.main.require('lodash');

const meta = require.main.require('./src/meta');
const privileges = require.main.require('./src/privileges');
const posts = require.main.require('./src/posts');
const topics = require.main.require('./src/topics');
const plugins = require.main.require('./src/plugins');
const categories = require.main.require('./src/categories');
const user = require.main.require('./src/user');

const Sockets = module.exports;

Sockets.push = async function (socket, pid) {
	const canRead = await privileges.posts.can('topics:read', pid, socket.uid);
	if (!canRead) {
		throw new Error('[[error:no-privileges]]');
	}

	const postData = await posts.getPostFields(pid, ['content', 'tid', 'uid', 'handle']);
	if (!postData && !postData.content) {
		throw new Error('[[error:invalid-pid]]');
	}

	const [topic, tags, isMain] = await Promise.all([
		topics.getTopicDataByPid(pid),
		topics.getTopicTags(postData.tid),
		posts.isMain(pid),
	]);

	if (!topic) {
		throw new Error('[[error:no-topic]]');
	}

	const result = await plugins.fireHook('filter:composer.push', {
		pid: pid,
		uid: postData.uid,
		handle: parseInt(meta.config.allowGuestHandles, 10) ? postData.handle : undefined,
		body: postData.content,
		title: topic.title,
		thumb: topic.thumb,
		tags: tags,
		isMain: isMain,
	});
	return result;
};

Sockets.editCheck = async function (socket, pid) {
	const isMain = await posts.isMain(pid);
	return { titleEditable: isMain };
};

Sockets.renderPreview = async function (socket, content) {
	return await plugins.fireHook('filter:parse.raw', content);
};

Sockets.renderHelp = async function () {
	const helpText = meta.config['composer:customHelpText'] || '';
	if (!meta.config['composer:showHelpTab']) {
		throw new Error('help-hidden');
	}

	const parsed = await plugins.fireHook('filter:parse.raw', helpText);
	if (meta.config['composer:allowPluginHelp']) {
		return await plugins.fireHook('filter:composer.help', parsed);
	}
	return helpText;
};

Sockets.getFormattingOptions = async function () {
	return await module.parent.exports.getFormattingOptions();
};

Sockets.getCategoriesForSelect = async function (socket, data) {
	const cids = await categories.getAllCidsFromSet('categories:cid');
	let [allowed, categoriesData, isModerator, isAdmin] = await Promise.all([
		privileges.categories.isUserAllowedTo('topics:create', cids, socket.uid),
		categories.getCategoriesData(cids),
		user.isModerator(socket.uid, cids),
		user.isAdministrator(socket.uid),
	]);

	const filtered = await plugins.fireHook('filter:composer.getCategoriesForSelect', {
		uid: socket.uid,
		allowed: allowed,
		categoriesData: categoriesData,
		isModerator: isModerator,
		isAdmin: isAdmin,
		query: data.query || {},
	});
	({ allowed, categoriesData, isModerator, isAdmin } = filtered);

	categories.getTree(categoriesData);

	const cidToAllowed = _.zipObject(cids, allowed.map((allowed, i) => isAdmin || isModerator[i] || allowed));
	const cidToCategory = _.zipObject(cids, categoriesData);

	const visibleCategories = categoriesData.filter(function (c) {
		if (!c) {
			return false;
		}

		const hasPostableChildren = checkPostableChildren(c, cidToAllowed);
		const shouldBeRemoved = !hasPostableChildren && (!cidToAllowed[c.cid] || c.link || c.disabled);
		const shouldBeDisaplayedAsDisabled = hasPostableChildren && (!cidToAllowed[c.cid] || c.link || c.disabled);
		if (shouldBeDisaplayedAsDisabled) {
			c.disabledClass = true;
		}

		if (shouldBeRemoved && c.parent && c.parent.cid && cidToCategory[c.parent.cid]) {
			cidToCategory[c.parent.cid].children = cidToCategory[c.parent.cid].children.filter(child => child.cid !== c.cid);
		}

		return !shouldBeRemoved;
	});

	return categories.buildForSelectCategories(visibleCategories, ['disabledClass']);
};

function checkPostableChildren(category, cidToAllowed) {
	if (!Array.isArray(category.children) || !category.children.length) {
		return false;
	}
	return category.children.some(c => c && !c.disabled && (cidToAllowed[c.cid] || checkPostableChildren(c, cidToAllowed)));
}
