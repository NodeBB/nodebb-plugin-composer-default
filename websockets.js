"use strict";

var async = require.main.require('async');

var meta = require.main.require('./src/meta');
var privileges = require.main.require('./src/privileges');
var posts = require.main.require('./src/posts');
var topics = require.main.require('./src/topics');
var plugins = require.main.require('./src/plugins');
var categories = require.main.require('./src/categories');

var server = require.main.require('./src/socket.io');

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
			}, next)
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

Sockets.getCategoriesForSelect = function (socket, data, callback) {
	var cids;
	async.waterfall([
		function (next) {
			categories.getAllCidsFromSet('categories:cid', next);
		},
		function (_cids, next) {
			cids = _cids;
			async.parallel({
				allowed: function (next) {
					privileges.categories.isUserAllowedTo('topics:create', cids, socket.uid, next);
				},
				categories: function (next) {
					categories.getCategoriesData(cids, next);
				},
			}, next);
		},
		function (results, next) {
			var _ = require.main.require('lodash')
			categories.getTree(results.categories);

			var cidToCategory = _.zipObject(cids, results.categories);

			results.categories = results.categories.filter(function (c, i) {
				if (!c) {
					return false;
				}
				if (results.allowed[i] && !c.link) {
					return true;
				}

				const hasChildren = !!c.children.length;
				if (hasChildren || c.link) {
					c.disabledClass = true;
				} else if (c.parent && c.parent.cid && cidToCategory[c.parent.cid]) {
					cidToCategory[c.parent.cid].children = cidToCategory[c.parent.cid].children.filter(child => {
						return child.cid !== c.cid;
					});
				}

				return hasChildren;
			});

			categories.buildForSelectCategories(results.categories, next);
		},
	], callback);
};
