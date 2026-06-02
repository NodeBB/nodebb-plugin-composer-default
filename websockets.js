'use strict';

const meta = nodebb.require('./src/meta');
const privileges = nodebb.require('./src/privileges');
const posts = nodebb.require('./src/posts');
const topics = nodebb.require('./src/topics');
const plugins = nodebb.require('./src/plugins');

const Sockets = module.exports;

Sockets.push = async function (socket, pid) {
	const canRead = await privileges.posts.can('topics:read', pid, socket.uid);
	if (!canRead) {
		throw new Error('[[error:no-privileges]]');
	}

	const postData = await posts.getPostFields(pid, ['content', 'sourceContent', 'tid', 'uid', 'handle', 'timestamp']);
	if (!postData || (!postData.content && !postData.sourceContent)) {
		throw new Error('[[error:invalid-pid]]');
	}

	const [topic, isMain] = await Promise.all([
		topics.getTopicDataByPid(pid),
		posts.isMain(pid),
	]);

	if (!topic) {
		throw new Error('[[error:no-topic]]');
	}

	const result = await plugins.hooks.fire('filter:composer.push', {
		pid: pid,
		uid: postData.uid,
		handle: parseInt(meta.config.allowGuestHandles, 10) ? postData.handle : undefined,
		body: postData.sourceContent || postData.content,
		title: topic.title,
		thumbs: topic.thumbs,
		tags: topic.tags.map(t => t.value),
		isMain: isMain,
		timestamp: postData.timestamp,
	});
	return result;
};

Sockets.editCheck = async function (socket, pid) {
	const isMain = await posts.isMain(pid);
	return { titleEditable: isMain };
};

Sockets.renderPreview = async function (socket, content) {
	return await plugins.hooks.fire('filter:parse.raw', content);
};

Sockets.renderHelp = async function () {
	const helpText = meta.config['composer:customHelpText'] || '';
	if (!meta.config['composer:showHelpTab']) {
		throw new Error('help-hidden');
	}

	const parsed = await plugins.hooks.fire('filter:parse.raw', helpText);
	if (meta.config['composer:allowPluginHelp'] && plugins.hooks.hasListeners('filter:composer.help')) {
		return await plugins.hooks.fire('filter:composer.help', parsed) || helpText;
	}
	return helpText;
};

Sockets.getFormattingOptions = async function () {
	return await require('./library').getFormattingOptions();
};

Sockets.shouldQueue = async function (socket, data) {
	if (!data || !data.postData) {
		throw new Error('[[error:invalid-data]]');
	}
	if (socket.uid <= 0) {
		return false;
	}

	let shouldQueue = false;
	const { postData } = data;
	if (postData.action === 'posts.reply') {
		shouldQueue = await posts.shouldQueue(socket.uid, {
			tid: postData.tid,
			content: postData.content || '',
		});
	} else if (postData.action === 'topics.post') {
		shouldQueue = await posts.shouldQueue(socket.uid, {
			cid: postData.cid,
			content: postData.content || '',
		});
	}
	return shouldQueue;
};
