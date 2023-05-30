'use strict';

$(document).ready(function () {
	$(window).on('action:app.load', function () {
		require(['composer/drafts'], function (drafts) {
			drafts.migrateGuest();
			drafts.loadOpen();
		});
	});

	$(window).on('action:composer.topic.new', function (ev, data) {
		if (config['composer-default'].composeRouteEnabled !== 'on') {
			require(['composer'], function (composer) {
				composer.newTopic({
					cid: data.cid,
					title: data.title || '',
					body: data.body || '',
					tags: data.tags || [],
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

	$(window).on('action:composer.post.edit', function (ev, data) {
		if (config['composer-default'].composeRouteEnabled !== 'on') {
			require(['composer'], function (composer) {
				composer.editPost({ pid: data.pid });
			});
		} else {
			ajaxify.go('compose?pid=' + data.pid);
		}
	});

	$(window).on('action:composer.post.new', function (ev, data) {
		// backwards compatibility
		data.body = data.body || data.text;
		data.title = data.title || data.topicName;
		if (config['composer-default'].composeRouteEnabled !== 'on') {
			require(['composer'], function (composer) {
				composer.newReply({
					tid: data.tid,
					toPid: data.pid,
					title: data.title,
					body: data.body,
				});
			});
		} else {
			ajaxify.go(
				'compose?tid=' + data.tid +
				(data.pid ? '&toPid=' + data.pid : '') +
				(data.title ? '&title=' + encodeURIComponent(data.title) : '') +
				(data.body ? '&body=' + encodeURIComponent(data.body) : '')
			);
		}
	});

	$(window).on('action:composer.addQuote', function (ev, data) {
		data.body = data.body || data.text;
		data.title = data.title || data.topicName;
		if (config['composer-default'].composeRouteEnabled !== 'on') {
			require(['composer'], function (composer) {
				var topicUUID = composer.findByTid(data.tid);
				composer.addQuote({
					tid: data.tid,
					toPid: data.pid,
					selectedPid: data.selectedPid,
					title: data.title,
					username: data.username,
					body: data.body,
					uuid: topicUUID,
				});
			});
		} else {
			ajaxify.go('compose?tid=' + data.tid + '&toPid=' + data.pid + '&quoted=1&username=' + data.username);
		}
	});

	$(window).on('action:composer.enhance', function (ev, data) {
		require(['composer'], function (composer) {
			composer.enhance(data.container);
		});
	});
});
