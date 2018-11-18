'use strict';

/* globals config, ajaxify */

$(document).ready(function() {
	// Load drafts if they were open
	try {
		var available = localStorage.getItem('drafts:available');
		var open = localStorage.getItem('drafts:open');
		available = JSON.parse(available) || [];
		open = JSON.parse(open) || [];
	} catch (e) {
		console.warn('[composer/drafts] Could not read list of open/available drafts');
		available = [];
		open = [];
	}

	if (available.length && app.user && app.user.uid !== 0) {
		require(['composer', 'composer/drafts'], function (composer, drafts) {
			// Deconstruct each save_id and open up composer
			available.forEach(function (save_id) {
				if (!save_id) {
					return;
				}
				var saveObj = save_id.split(':');
				var uid = saveObj[1];
				var type = saveObj[2];
				var id = saveObj[3];
				var content = drafts.getDraft(save_id);

				// If draft is already open, do nothing
				if (open.indexOf(save_id) !== -1) {
					return;
				}

				if (!content || !content.length || parseInt(app.user.uid, 10) !== parseInt(uid, 10)) {
					// Empty content, remove from list of open drafts
					drafts.updateVisibility('available', save_id);
					drafts.updateVisibility('open', save_id);
					return;
				}

				if (type === 'cid') {
					composer.newTopic({
						cid: id,
						title: '',
						body: content,
						tags: [],
					});
				} else if (type === 'tid') {
					socket.emit('topics.getTopic', id, function (err, topicObj) {
						composer.newReply(id, undefined, topicObj.title, content);
					});
				} else if (type === 'pid') {
					composer.editPost(id);
				}
			});
		});
	}

	$(window).on('unload', function (e) {
		// Update visibility on all open composers
		try {
			var open = localStorage.getItem('drafts:open');
			open = JSON.parse(open) || [];
		} catch (e) {
			console.warn('[composer/drafts] Could not read list of open/available drafts');
			open = [];
		}
		if (open.length) {
			require(['composer/drafts'], function (drafts) {
				open.forEach(function (save_id) {
					drafts.updateVisibility('open', save_id);
				});
			});
		}
	});

	$(window).on('action:composer.topic.new', function(ev, data) {
		if (config['composer-default'].composeRouteEnabled !== 'on') {
			require(['composer'], function(composer) {
				composer.newTopic({
					cid: data.cid,
					title: data.title || '',
					body: data.body || '',
					tags: data.tags || []
				});
			});
		} else {
			ajaxify.go(
				'compose?cid=' + data.cid +
				(data.title ? '&title=' + encodeURIComponent(data.title) : '') +
				(data.body ? '&body=' + encodeURIComponent(data.body) : '')
			);
		}
	});

	$(window).on('action:composer.post.edit', function(ev, data) {
		if (config['composer-default'].composeRouteEnabled !== 'on') {
			require(['composer'], function(composer) {
				composer.editPost(data.pid);
			});
		} else {
			ajaxify.go('compose?pid=' + data.pid);
		}
	});

	$(window).on('action:composer.post.new', function(ev, data) {
		if (config['composer-default'].composeRouteEnabled !== 'on') {
			require(['composer'], function(composer) {
				composer.newReply(data.tid, data.pid, data.topicName, data.text);
			});
		} else {
			ajaxify.go(
				'compose?tid=' + data.tid +
				(data.pid ? '&toPid=' + data.pid : '') +
				(data.topicName ? '&title=' + encodeURIComponent(data.topicName) : '') +
				(data.text ? '&body=' + encodeURIComponent(data.text) : '')
			);
		}
	});

	$(window).on('action:composer.addQuote', function(ev, data) {
		if (config['composer-default'].composeRouteEnabled !== 'on') {
			require(['composer'], function(composer) {
				var topicUUID = composer.findByTid(data.tid);
				composer.addQuote(data.tid, data.pid, data.selectedPid, data.topicName, data.username, data.text, topicUUID);
			});
		} else {
			ajaxify.go('compose?tid=' + data.tid + '&toPid=' + data.pid + '&quoted=1&username=' + data.username);
		}
	});

	$(window).on('action:composer.enhance', function(ev, data) {
		require(['composer'], function(composer) {
			composer.enhance(data.container);
		});
	});

});