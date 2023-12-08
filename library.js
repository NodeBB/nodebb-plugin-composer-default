'use strict';

const url = require('url');

const nconf = require.main.require('nconf');
const validator = require('validator');

const plugins = require.main.require('./src/plugins');
const topics = require.main.require('./src/topics');
const categories = require.main.require('./src/categories');
const posts = require.main.require('./src/posts');
const user = require.main.require('./src/user');
const meta = require.main.require('./src/meta');
const privileges = require.main.require('./src/privileges');
const translator = require.main.require('./src/translator');
const utils = require.main.require('./src/utils');
const helpers = require.main.require('./src/controllers/helpers');
const SocketPlugins = require.main.require('./src/socket.io/plugins');
const socketMethods = require('./websockets');

const plugin = module.exports;

plugin.socketMethods = socketMethods;

plugin.init = async function (data) {
	const { router } = data;
	const routeHelpers = require.main.require('./src/routes/helpers');
	const controllers = require('./controllers');
	SocketPlugins.composer = socketMethods;
	routeHelpers.setupAdminPageRoute(router, '/admin/plugins/composer-default', controllers.renderAdminPage);
};

plugin.appendConfig = async function (config) {
	config['composer-default'] = await meta.settings.get('composer-default');
	return config;
};

plugin.addAdminNavigation = async function (header) {
	header.plugins.push({
		route: '/plugins/composer-default',
		icon: 'fa-edit',
		name: 'Composer (Default)',
	});
	return header;
};

plugin.addPrefetchTags = async function (hookData) {
	const prefetch = [
		'/assets/src/modules/composer.js', '/assets/src/modules/composer/uploads.js', '/assets/src/modules/composer/drafts.js',
		'/assets/src/modules/composer/tags.js', '/assets/src/modules/composer/categoryList.js', '/assets/src/modules/composer/resize.js',
		'/assets/src/modules/composer/autocomplete.js', '/assets/templates/composer.tpl',
		`/assets/language/${meta.config.defaultLang || 'en-GB'}/topic.json`,
		`/assets/language/${meta.config.defaultLang || 'en-GB'}/modules.json`,
		`/assets/language/${meta.config.defaultLang || 'en-GB'}/tags.json`,
	];

	hookData.links = hookData.links.concat(prefetch.map(path => ({
		rel: 'prefetch',
		href: `${nconf.get('relative_path') + path}?${meta.config['cache-buster']}`,
	})));

	return hookData;
};

plugin.getFormattingOptions = async function () {
	const defaultVisibility = {
		mobile: true,
		desktop: true,

		// op or reply
		main: true,
		reply: true,
	};
	let payload = {
		defaultVisibility,
		options: [
			{
				name: 'tags',
				title: '[[global:tags.tags]]',
				className: 'fa fa-tags',
				visibility: {
					...defaultVisibility,
					desktop: false,
				},
			},
			{
				name: 'zen',
				title: '[[modules:composer.zen-mode]]',
				className: 'fa fa-arrows-alt',
				visibility: defaultVisibility,
			},
		],
	};
	if (parseInt(meta.config.allowTopicsThumbnail, 10) === 1) {
		payload.options.push({
			name: 'thumbs',
			title: '[[topic:composer.thumb-title]]',
			className: 'fa fa-address-card-o',
			badge: true,
			visibility: {
				...defaultVisibility,
				reply: false,
			},
		});
	}

	payload = await plugins.hooks.fire('filter:composer.formatting', payload);

	payload.options.forEach((option) => {
		option.visibility = {
			...defaultVisibility,
			...option.visibility || {},
		};
	});

	return payload ? payload.options : null;
};

plugin.filterComposerBuild = async function (hookData) {
	const { req } = hookData;
	const { res } = hookData;

	if (req.query.p) {
		try {
			const a = url.parse(req.query.p, true, true);
			return helpers.redirect(res, `/${(a.path || '').replace(/^\/*/, '')}`);
		} catch (e) {
			return helpers.redirect(res, '/');
		}
	} else if (!req.query.pid && !req.query.tid && !req.query.cid) {
		return helpers.redirect(res, '/');
	}
	const [
		isMainPost,
		postData,
		topicData,
		categoryData,
		isAdmin,
		isMod,
		formatting,
		tagWhitelist,
		globalPrivileges,
		canTagTopics,
		canScheduleTopics,
	] = await Promise.all([
		posts.isMain(req.query.pid),
		getPostData(req),
		getTopicData(req),
		categories.getCategoryFields(req.query.cid, [
			'name', 'icon', 'color', 'bgColor', 'backgroundImage', 'imageClass', 'minTags', 'maxTags',
		]),
		user.isAdministrator(req.uid),
		isModerator(req),
		plugin.getFormattingOptions(),
		getTagWhitelist(req.query, req.uid),
		privileges.global.get(req.uid),
		canTag(req),
		canSchedule(req),
	]);

	const isEditing = !!req.query.pid;
	const isGuestPost = postData && parseInt(postData.uid, 10) === 0;
	const save_id = utils.generateSaveId(req.uid);
	const discardRoute = generateDiscardRoute(req, topicData);
	const body = await generateBody(req, postData);

	let action = 'topics.post';
	let isMain = isMainPost;
	if (req.query.tid) {
		action = 'posts.reply';
	} else if (req.query.pid) {
		action = 'posts.edit';
	} else {
		isMain = true;
	}
	globalPrivileges['topics:tag'] = canTagTopics;
	const cid = parseInt(req.query.cid, 10);
	const topicTitle = topicData && topicData.title ? topicData.title.replace(/%/g, '&#37;').replace(/,/g, '&#44;') : validator.escape(String(req.query.title || ''));
	return {
		req: req,
		res: res,
		templateData: {
			disabled: !req.query.pid && !req.query.tid && !req.query.cid,
			pid: parseInt(req.query.pid, 10),
			tid: parseInt(req.query.tid, 10),
			cid: cid || (topicData ? topicData.cid : null),
			action: action,
			toPid: parseInt(req.query.toPid, 10),
			discardRoute: discardRoute,

			resizable: false,
			allowTopicsThumbnail: parseInt(meta.config.allowTopicsThumbnail, 10) === 1 && isMain,

			// can't use title property as that is used for page title
			topicTitle: topicTitle,
			titleLength: topicTitle ? topicTitle.length : 0,
			topic: topicData,
			thumb: topicData ? topicData.thumb : '',
			body: body,

			isMain: isMain,
			isTopicOrMain: !!req.query.cid || isMain,
			maximumTitleLength: meta.config.maximumTitleLength,
			maximumPostLength: meta.config.maximumPostLength,
			minimumTagLength: meta.config.minimumTagLength || 3,
			maximumTagLength: meta.config.maximumTagLength || 15,
			tagWhitelist: tagWhitelist,
			selectedCategory: cid ? categoryData : null,
			minTags: categoryData.minTags,
			maxTags: categoryData.maxTags,

			isTopic: !!req.query.cid,
			isEditing: isEditing,
			canSchedule: canScheduleTopics,
			showHandleInput: meta.config.allowGuestHandles === 1 &&
				(req.uid === 0 || (isEditing && isGuestPost && (isAdmin || isMod))),
			handle: postData ? postData.handle || '' : undefined,
			formatting: formatting,
			isAdminOrMod: isAdmin || isMod,
			save_id: save_id,
			privileges: globalPrivileges,
			'composer:showHelpTab': meta.config['composer:showHelpTab'] === 1,
		},
	};
};

function generateDiscardRoute(req, topicData) {
	if (req.query.cid) {
		return `${nconf.get('relative_path')}/category/${validator.escape(String(req.query.cid))}`;
	} else if ((req.query.tid || req.query.pid)) {
		if (topicData) {
			return `${nconf.get('relative_path')}/topic/${topicData.slug}`;
		}
		return `${nconf.get('relative_path')}/`;
	}
}

async function generateBody(req, postData) {
	let body = '';
	// Quoted reply
	if (req.query.toPid && parseInt(req.query.quoted, 10) === 1 && postData) {
		const username = await user.getUserField(postData.uid, 'username');
		const translated = await translator.translate(`[[modules:composer.user-said, ${username}]]`);
		body = `${translated}\n` +
			`> ${postData ? `${postData.content.replace(/\n/g, '\n> ')}\n\n` : ''}`;
	} else if (req.query.body || req.query.content) {
		body = validator.escape(String(req.query.body || req.query.content));
	}
	body = postData ? postData.content : '';
	return translator.escape(body);
}

async function getPostData(req) {
	if (!req.query.pid && !req.query.toPid) {
		return null;
	}

	return await posts.getPostData(req.query.pid || req.query.toPid);
}

async function getTopicData(req) {
	if (req.query.tid) {
		return await topics.getTopicData(req.query.tid);
	} else if (req.query.pid) {
		return await topics.getTopicDataByPid(req.query.pid);
	}
	return null;
}

async function isModerator(req) {
	if (!req.loggedIn) {
		return false;
	}
	const cid = cidFromQuery(req.query);
	return await user.isModerator(req.uid, cid);
}

async function canTag(req) {
	if (parseInt(req.query.cid, 10)) {
		return await privileges.categories.can('topics:tag', req.query.cid, req.uid);
	}
	return true;
}

async function canSchedule(req) {
	if (parseInt(req.query.cid, 10)) {
		return await privileges.categories.can('topics:schedule', req.query.cid, req.uid);
	}
	return false;
}

async function getTagWhitelist(query, uid) {
	const cid = await cidFromQuery(query);
	const [tagWhitelist, isAdminOrMod] = await Promise.all([
		categories.getTagWhitelist([cid]),
		privileges.categories.isAdminOrMod(cid, uid),
	]);
	return categories.filterTagWhitelist(tagWhitelist[0], isAdminOrMod);
}

async function cidFromQuery(query) {
	if (query.cid) {
		return query.cid;
	} else if (query.tid) {
		return await topics.getTopicField(query.tid, 'cid');
	} else if (query.pid) {
		return await posts.getCidByPid(query.pid);
	}
	return null;
}
