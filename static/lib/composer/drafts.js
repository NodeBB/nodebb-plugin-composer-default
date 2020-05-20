'use strict';

/* globals define */

define('composer/drafts', function () {

	var drafts = {};
	var	saveThrottleId;
	var saving = false;

	drafts.init = function(postContainer, postData) {
		var draftIconEl = postContainer.find('.draft-icon');

		postContainer.on('keyup', 'textarea, input.handle, input.title', function() {
			resetTimeout();

			saveThrottleId = setTimeout(function() {
				saveDraft(postContainer, draftIconEl, postData);
			}, 1000);
		});

		draftIconEl.on('animationend', function () {
			$(this).toggleClass('active', false);
		});

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
				open.forEach(function (save_id) {
					drafts.updateVisibility('open', save_id);
				});
			}
		});

		drafts.migrateGuest();
	};

	function resetTimeout() {
		if (saveThrottleId) {
			clearTimeout(saveThrottleId);
			saveThrottleId = 0;
		}
	}

	// deprecated, for removal v1.14.x
	drafts.getDraft = function(save_id) {
		console.warn('[composer/drafts] drafts.getDraft is deprecated! Use drafts.get() instead.');
		return localStorage.getItem(save_id);
	};

	drafts.get = function(save_id) {
		const uid = save_id.split(':')[1];

		if (parseInt(uid, 10)) {
			return {
				title: localStorage.getItem(save_id + ':title'),
				text: localStorage.getItem(save_id),
			}
		} else {
			return {
				handle: sessionStorage.getItem(save_id + ':handle'),
				title: sessionStorage.getItem(save_id + ':title'),
				text: sessionStorage.getItem(save_id),
			}
		}
	}

	function saveDraft(postContainer, draftIconEl, postData) {
		if (canSave(app.user.uid ? 'localStorage' : 'sessionStorage') && postData && postData.save_id && postContainer.length) {
			var title = postContainer.find('input.title').val();
			var raw = postContainer.find('textarea').val();
			var storage = app.user.uid ? localStorage : sessionStorage;

			if (raw.length) {
				storage.setItem(postData.save_id, raw);
				storage.setItem(postData.save_id + ':title', title);
				if (!app.user.uid) {
					var handle = postContainer.find('input.handle').val();
					storage.setItem(postData.save_id + ':handle', handle);
				}
				draftIconEl.toggleClass('active', true);
			} else {
				drafts.removeDraft(postData.save_id);
			}
		}
	}

	drafts.removeDraft = function(save_id) {
		if (!save_id) {
			return;
		}
		resetTimeout();
		// Remove save_id from list of open and available drafts
		drafts.updateVisibility('available', save_id);
		drafts.updateVisibility('open', save_id);

		localStorage.removeItem(save_id);
		localStorage.removeItem(save_id + ':title');
		return;
	};

	drafts.updateVisibility = function (set, save_id, add) {
		if (!canSave(app.user.uid ? 'localStorage' : 'sessionStorage') || !save_id) {
			return;
		}

		try {
			var open = localStorage.getItem('drafts:' + set);
			open = open ? JSON.parse(open) : [];
		} catch (e) {
			console.warn('[composer/drafts] Could not read list of open drafts');
			var open = [];
		}
		var idx = open.indexOf(save_id);

		if (add && idx === -1) {
			open.push(save_id);
		} else if (!add && idx !== -1) {
			open.splice(idx, 1);
		}	// otherwise do nothing

		localStorage.setItem('drafts:' + set, JSON.stringify(open));
	};

	drafts.migrateGuest = function () {
		// If any drafts are made while as guest, and user then logs in, assume control of those drafts
		if (canSave('localStorage') && app.user.uid) {
			var test = /^composer:\d+:\w+:\d+(:\w+)?$/;
			var keys = Object.keys(sessionStorage).filter(function (key) {
				return test.test(key);
			});
			var migrated = new Set([]);
			var renamed = keys.map(function (key) {
				var parts = key.split(':');
				parts[1] = app.user.uid;

				migrated.add(parts.slice(0, 4).join(':'));
				return parts.join(':');
			});

			keys.forEach(function (key, idx) {
				localStorage.setItem(renamed[idx], sessionStorage.getItem(key));
				sessionStorage.removeItem(key);
			});

			migrated.forEach(function(save_id) {
				drafts.updateVisibility('available', save_id, 1);
			});

			return migrated;
		}
	}

	drafts.loadOpen = function () {
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
			require(['composer'], function (composer) {
				// Deconstruct each save_id and open up composer
				available.forEach(function (save_id) {
					if (!save_id) {
						return;
					}
					var saveObj = save_id.split(':');
					var uid = saveObj[1];
					var type = saveObj[2];
					var id = saveObj[3];
					var content = drafts.get(save_id);

					// If draft is already open, do nothing
					if (open.indexOf(save_id) !== -1) {
						return;
					}

					// Don't open other peoples' drafts
					if (parseInt(app.user.uid, 10) !== parseInt(uid, 10)) {
						return;
					}

					if (!content || (content.text && content.title && !content.text.title && !content.text.length)) {
						// Empty content, remove from list of open drafts
						drafts.updateVisibility('available', save_id);
						drafts.updateVisibility('open', save_id);
						return;
					}

					if (type === 'cid') {
						composer.newTopic({
							cid: id,
							title: content.title,
							body: content.text,
							tags: [],
						});
					} else if (type === 'tid') {
						socket.emit('topics.getTopic', id, function (err, topicObj) {
							composer.newReply(id, undefined, topicObj.title, content.text);
						});
					} else if (type === 'pid') {
						composer.editPost(id);
					}
				});
			});
		}
	}

	// Feature detection courtesy of: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
	function canSave(type) {
		var storage;
		try {
			storage = window[type];
			var x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		}
		catch(e) {
			return e instanceof DOMException && (
				// everything except Firefox
				e.code === 22 ||
				// Firefox
				e.code === 1014 ||
				// test name field too, because code might not be present
				// everything except Firefox
				e.name === 'QuotaExceededError' ||
				// Firefox
				e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
				// acknowledge QuotaExceededError only if there's something already stored
				(storage && storage.length !== 0);
		}
	}

	return drafts;
});