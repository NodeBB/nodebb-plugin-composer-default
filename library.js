"use strict";

var plugins = module.parent.require('./plugins'),
	topics = module.parent.require('./topics'),
	posts = module.parent.require('./posts'),
	user = module.parent.require('./user'),
	meta = module.parent.require('./meta'),
	translator = module.parent.require('../public/src/modules/translator'),
	helpers = module.parent.require('./controllers/helpers'),
	SocketPlugins = require.main.require('./src/socket.io/plugins'),
	socketMethods = require('./websockets'),

	async = module.parent.require('async'),
	nconf = module.parent.require('nconf'),

	plugin = {
		socketMethods: socketMethods
	};

plugin.init = function(data, callback) {
	var controllers = require('./controllers');
	SocketPlugins.composer = socketMethods;

	data.router.get('/admin/plugins/composer-default', data.middleware.admin.buildHeader, controllers.renderAdminPage);
	data.router.get('/api/admin/plugins/composer-default', controllers.renderAdminPage);

	callback();
};

plugin.appendConfig = function(config, callback) {
	meta.settings.get('composer-default', function(err, settings) {
		if (err) {
			return callback(null, config);
		}

		config['composer-default'] = settings;
		callback(null, config);
	});
};

plugin.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/plugins/composer-default',
		icon: 'fa-edit',
		name: 'Composer (Default)'
	});

	callback(null, header);
};

plugin.getFormattingOptions = function(callback) {
	plugins.fireHook('filter:composer.formatting', {
		options: [
			{ name: 'tags', className: 'fa fa-tags', mobile: true }
		]
	}, function(err, payload) {
		callback(err, payload ? payload.options : null);
	});
};

plugin.build = function(data, callback) {
	var req = data.req,
		res = data.res,
		next = data.next;

	if (req.query.p) {
		if (!res.locals.isAPI) {
			if (req.query.p.startsWith(nconf.get('relative_path'))) {
				req.query.p = req.query.p.replace(nconf.get('relative_path'), '');
			}

			return helpers.redirect(res, req.query.p);
		} else {
			return res.render('', {});
		}
	} else if (!req.query.pid && !req.query.tid && !req.query.cid) {
		return helpers.redirect(res, '/');
	}

	var uid = req.user ? req.user.uid : 0;

	async.parallel({
		isMain: async.apply(posts.isMain, req.query.pid),
		postData: function(next) {
			if (!req.query.pid && !req.query.toPid) {
				return next();
			}

			posts.getPostData(req.query.pid || req.query.toPid, next);
		},
		topicData: function(next) {
			if (req.query.tid) {
				topics.getTopicData(req.query.tid, next);
			} else if (req.query.pid) {
				topics.getTopicDataByPid(req.query.pid, next);
			} else {
				return next();
			}
		},
		isAdmin: async.apply(user.isAdministrator, uid),
		isMod: function(next) {
			if (!uid) {
				next(null, false);
			} else if (req.query.cid) {
				user.isModerator(uid, req.query.cid, next);
			} else if (req.query.tid) {
				async.waterfall([
					async.apply(topics.getTopicField, req.query.tid, 'cid'),
					async.apply(user.isModerator, uid)
				], next);
			} else if (req.query.pid) {
				posts.isModerator(req.query.pid, uid, next);
			} else {
				next(null, false);
			}
		},
		formatting: async.apply(plugin.getFormattingOptions)
	}, function(err, data) {
		var isEditing = !!req.query.pid,
			isGuestPost = data.postData && parseInt(data.postData.uid, 10) === 0,
			save_id, discardRoute, body;

		if (uid) {
			if (req.query.cid) {
				save_id = ['composer', uid, 'cid', req.query.cid].join(':');
			} else if (req.query.tid) {
				save_id = ['composer', uid, 'tid', req.query.tid].join(':');
			} else if (req.query.pid) {
				save_id = ['composer', uid, 'pid', req.query.pid].join(':');
			}
		}

		if (req.query.cid) {
			discardRoute = nconf.get('relative_path') + '/category/' + req.query.cid;
		} else if ((req.query.tid || req.query.pid)) {
			if (data.topicData) {
				discardRoute = nconf.get('relative_path') + '/topic/' + data.topicData.slug;
			} else {
				return next();
			}
		}

		// Quoted reply
		if (req.query.toPid && parseInt(req.query.quoted, 10) === 1 && data.postData) {
			user.getUserField(data.postData.uid, 'username', function(err, username) {
				translator.translate('[[modules:composer.user_said, ' + username + ']]', function(translated) {
					body = '> ' + (data.postData ? data.postData.content.replace(/\n/g, '\n> ') + '\n\n' : '');
					body = translated + '\n' + body;
					ready();
				});
			});
		} else {
			body = data.postData ? data.postData.content : '';
			ready();
		}

		function ready() {
			var action = 'topics.post';
			if (!!req.query.tid) {
				action = 'posts.reply';
			} else if (!!req.query.pid) {
				action = 'posts.edit';
			} else {
				data.isMain = true;
			}

			callback(null, {
				req: req,
				res: res,
				templateData: {
					disabled: !req.query.pid && !req.query.tid && !req.query.cid,
					pid: parseInt(req.query.pid, 10),
					tid: parseInt(req.query.tid, 10),
					cid: parseInt(req.query.cid, 10),
					action: action,
					toPid: parseInt(req.query.toPid, 10),
					discardRoute: discardRoute,

					resizable: false,
					allowTopicsThumbnail: meta.config.allowTopicsThumbnail && data.isMain,

					topicTitle: data.topicData ? data.topicData.title.replace(/%/g, '&#37;').replace(/,/g, '&#44;') : '',
					body: body,

					isMain: data.isMain,
					isTopicOrMain: !!req.query.cid || data.isMain,
					// minimumTagLength:
					// maximumTagLength:
					isTopic: !!req.query.cid,
					isEditing: isEditing,
					showHandleInput: meta.config.allowGuestHandles && (req.uid === 0 || (isEditing && isGuestPost && (data.isAdmin || data.isMod))),
					handle: data.postData ? data.postData.handle || '' : undefined,
					formatting: data.formatting,
					isAdminOrMod: data.isAdmin || data.isMod,
					save_id: save_id
				}
			});
		}
	});
};

module.exports = plugin;
