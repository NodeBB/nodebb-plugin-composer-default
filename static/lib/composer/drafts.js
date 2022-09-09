'use strict';

define('composer/drafts', ['api', 'alerts'], function (api, alerts) {
	var drafts = {};
	var saveThrottleId;

	drafts.init = function (postContainer, postData) {
		var draftIconEl = postContainer.find('.draft-icon');
		function saveThrottle() {
			resetTimeout();

			saveThrottleId = setTimeout(function () {
				saveDraft(postContainer, draftIconEl, postData);
			}, 1000);
		}

		postContainer.on('keyup', 'textarea, input.handle, input.title', saveThrottle);
		postContainer.on('click', 'input[type="checkbox"]', saveThrottle);
		postContainer.on('thumb.uploaded', saveThrottle);

		draftIconEl.on('animationend', function () {
			$(this).toggleClass('active', false);
		});

		$(window).on('unload', function () {
			// Update visibility on all open composers
			var open = [];
			try {
				open = localStorage.getItem('drafts:open');
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
		drafts.migrateThumbs(...arguments);
	};

	function resetTimeout() {
		if (saveThrottleId) {
			clearTimeout(saveThrottleId);
			saveThrottleId = 0;
		}
	}

	// deprecated, for removal v1.14.x
	drafts.getDraft = function (save_id) {
		console.warn('[composer/drafts] drafts.getDraft is deprecated! Use drafts.get() instead.');
		return localStorage.getItem(save_id);
	};

	function getStorage(uid) {
		return parseInt(uid, 10) > 0 ? localStorage : sessionStorage;
	}

	drafts.get = function (save_id) {
		var uid = save_id.split(':')[1];
		var storage = getStorage(uid);
		var draft = {
			text: storage.getItem(save_id),
		};
		['cid', 'title', 'tags', 'uuid'].forEach(function (key) {
			const value = storage.getItem(save_id + ':' + key);
			if (value) {
				draft[key] = value;
			}
		});
		if (!parseInt(uid, 10)) {
			draft.handle = storage.getItem(save_id + ':handle');
		}

		$(window).trigger('action:composer.drafts.get', {
			save_id: save_id,
			draft: draft,
			storage: storage,
		});
		return draft;
	};

	function saveDraft(postContainer, draftIconEl, postData) {
		if (canSave(app.user.uid ? 'localStorage' : 'sessionStorage') && postData && postData.save_id && postContainer.length) {
			const titleEl = postContainer.find('input.title');
			const title = titleEl && titleEl.val();
			var raw = postContainer.find('textarea').val();
			var storage = getStorage(app.user.uid);

			if (postData.hasOwnProperty('cid') && !postData.save_id.endsWith(':cid:' + postData.cid)) {
				// A new cid was selected, the save_id needs updating
				drafts.removeDraft(postData.save_id);	// First, delete the old draft
				postData.save_id = postData.save_id.replace(/cid:\d+$/, 'cid:' + postData.cid);	// then create a new save_id
			}

			if (raw.length || (title && title.length)) {
				storage.setItem(postData.save_id, raw);
				storage.setItem(`${postData.save_id}:uuid`, postContainer.attr('data-uuid'));

				if (postData.hasOwnProperty('cid')) {
					// New topic only
					const tags = postContainer.find('input.tags').val();
					storage.setItem(postData.save_id + ':tags', tags);
					storage.setItem(postData.save_id + ':title', title);
				}
				if (!app.user.uid) {
					var handle = postContainer.find('input.handle').val();
					storage.setItem(postData.save_id + ':handle', handle);
				}

				$(window).trigger('action:composer.drafts.save', {
					storage: storage,
					postData: postData,
					postContainer: postContainer,
				});
				draftIconEl.toggleClass('active', true);
			} else {
				drafts.removeDraft(postData.save_id);
			}
		}
	}

	drafts.removeDraft = function (save_id) {
		if (!save_id) {
			return;
		}
		resetTimeout();
		// Remove save_id from list of open and available drafts
		drafts.updateVisibility('available', save_id);
		drafts.updateVisibility('open', save_id);
		var uid = save_id.split(':')[1];
		var storage = getStorage(uid);
		const keys = Object.keys(storage).filter(key => key.startsWith(save_id));
		keys.forEach(key => storage.removeItem(key));
	};

	drafts.updateVisibility = function (set, save_id, add) {
		if (!canSave(app.user.uid ? 'localStorage' : 'sessionStorage') || !save_id) {
			return;
		}
		var open = [];
		try {
			open = localStorage.getItem('drafts:' + set);
			open = open ? JSON.parse(open) : [];
		} catch (e) {
			console.warn('[composer/drafts] Could not read list of open drafts');
			open = [];
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

			migrated.forEach(function (save_id) {
				drafts.updateVisibility('available', save_id, 1);
			});

			return migrated;
		}
	};

	drafts.migrateThumbs = function (postContainer, postData) {
		if (!app.uid) {
			return;
		}

		// If any thumbs were uploaded, migrate them to this new composer's uuid
		const newUUID = postContainer.attr('data-uuid');
		const draft = drafts.get(postData.save_id);

		if (draft && draft.uuid) {
			api.put(`/topics/${draft.uuid}/thumbs`, {
				tid: newUUID,
			}).then(() => {
				require(['composer'], function (composer) {
					composer.updateThumbCount(newUUID, postContainer);
				});
			});
		}
	};

	drafts.loadOpen = function () {
		if (ajaxify.data.template.login || ajaxify.data.template.register) {
			return;
		}
		// Load drafts if they were open
		var available;
		var open = [];
		try {
			available = localStorage.getItem('drafts:available');
			open = localStorage.getItem('drafts:open');
			available = JSON.parse(available) || [];
			open = JSON.parse(open) || [];
		} catch (e) {
			console.warn('[composer/drafts] Could not read list of open/available drafts');
			available = [];
			open = [];
		}

		if (available.length) {
			// Deconstruct each save_id and open up composer
			available.forEach(function (save_id) {
				if (!save_id) {
					return;
				}
				var saveObj = save_id.split(':');
				var uid = saveObj[1];
				var type = saveObj[2];
				var id = saveObj[3];
				var draft = drafts.get(save_id);

				// If draft is already open, do nothing
				if (open.indexOf(save_id) !== -1) {
					return;
				}

				// Don't open other peoples' drafts
				if (parseInt(app.user.uid, 10) !== parseInt(uid, 10)) {
					return;
				}

				if (!draft || (draft.text && draft.title && !draft.text.title && !draft.text.length)) {
					// Empty content, remove from list of open drafts
					drafts.updateVisibility('available', save_id);
					drafts.updateVisibility('open', save_id);
					return;
				}
				require(['composer'], function (composer) {
					if (type === 'cid') {
						composer.newTopic({
							cid: id,
							handle: app.user && app.user.uid ? undefined : utils.escapeHTML(draft.handle),
							title: utils.escapeHTML(draft.title),
							body: utils.escapeHTML(draft.text),
							tags: String(draft.tags || '').split(','),
						});
					} else if (type === 'tid') {
						api.get('/topics/' + id, {}, function (err, topicObj) {
							if (err) {
								return alerts.error(err);
							}
							composer.newReply(id, undefined, topicObj.title, utils.escapeHTML(draft.text));
						});
					} else if (type === 'pid') {
						composer.editPost(id);
					}
				});
			});
		}
	};

	// Feature detection courtesy of: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
	function canSave(type) {
		var storage;
		try {
			storage = window[type];
			var x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		} catch (e) {
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
