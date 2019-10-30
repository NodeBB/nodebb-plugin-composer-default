"use strict";

var async = require.main.require('async');
const _ = require.main.require('lodash');

var meta = require.main.require('./src/meta');
var privileges = require.main.require('./src/privileges');
var posts = require.main.require('./src/posts');
var topics = require.main.require('./src/topics');
var plugins = require.main.require('./src/plugins');
var categories = require.main.require('./src/categories');
var user = require.main.require('./src/user');

var Sockets = module.exports;

Sockets.push = function(socket, pid, callback) {
	var postData;
	async.waterfall([
		function (next) {
			privileges.posts.can('topics:read', pid, socket.uid, next);
		},
		function (canRead, next) {
			if (!canRead) {
				return next(new Error('[[error:no-privileges]]'));
			}
			posts.getPostFields(pid, ['content', 'tid', 'uid', 'handle'], next);
		},
		function (_postData, next) {
			postData = _postData;
			if (!postData && !postData.content) {
				return next(new Error('[[error:invalid-pid]]'));
			}
			async.parallel({
				topic: function(next) {
					topics.getTopicDataByPid(pid, next);
				},
				tags: function(next) {
					topics.getTopicTags(postData.tid, next);
				},
				isMain: function(next) {
					posts.isMain(pid, next);
				}
			}, next);
		},
		function (results, next) {
			if (!results.topic) {
				return next(new Error('[[error:no-topic]]'));
			}
			plugins.fireHook('filter:composer.push', {
				pid: pid,
				uid: postData.uid,
				handle: parseInt(meta.config.allowGuestHandles, 10) ? postData.handle : undefined,
				body: postData.content,
				title: results.topic.title,
				thumb: results.topic.thumb,
				tags: results.tags,
				isMain: results.isMain
			}, next);
		},
	], callback);
};

Sockets.editCheck = function(socket, pid, callback) {
	posts.isMain(pid, function(err, isMain) {
		callback(err, {
			titleEditable: isMain
		});
	});
};

Sockets.renderPreview = function(socket, content, callback) {
	plugins.fireHook('filter:parse.raw', content, callback);
};

Sockets.renderHelp = function(socket, data, callback) {
	var helpText = meta.config['composer:customHelpText'] || '';

	if (meta.config['composer:showHelpTab'] === '0') {
		return callback(new Error('help-hidden'));
	}

	plugins.fireHook('filter:parse.raw', helpText, function(err, helpText) {
		if (!meta.config['composer:allowPluginHelp'] || meta.config['composer:allowPluginHelp'] === '1') {
			plugins.fireHook('filter:composer.help', helpText, callback);
		} else {
			callback(null, helpText);
		}
	});
};

Sockets.getFormattingOptions = function(socket, data, callback) {
	module.parent.exports.getFormattingOptions(callback);
};

Sockets.getCategoriesForSelect = async function (socket) {
	const cids = await categories.getAllCidsFromSet('categories:cid');
	const [allowed, categoriesData, isModerator, isAdmin] = await Promise.all([
		privileges.categories.isUserAllowedTo('topics:create', cids, socket.uid),
		categories.getCategoriesData(cids),
		user.isModerator(socket.uid, cids),
		user.isAdministrator(socket.uid),
	]);

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
	return category.children.some(c => c && (cidToAllowed[c.cid] || checkPostableChildren(c, cidToAllowed)));
}
