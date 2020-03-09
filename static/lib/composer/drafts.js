'use strict';

/* globals define */

define('composer/drafts', function() {

	var drafts = {};
	var	saveThrottleId;
	var saving = false;

	drafts.init = function(postContainer, postData) {
		var bodyEl = postContainer.find('textarea');
		var draftIconEl = postContainer.find('.draft-icon');

		bodyEl.on('keyup', function() {
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
		return {
			title: localStorage.getItem(save_id + ':title'),
			text: localStorage.getItem(save_id),
		}
	}

	function saveDraft(postContainer, draftIconEl, postData) {
		var raw;
		var title;

		if (canSave() && postData && postData.save_id && postContainer.length) {
			title = postContainer.find('input.title').val();
			raw = postContainer.find('textarea').val();
			if (raw.length) {
				localStorage.setItem(postData.save_id, raw);
				localStorage.setItem(postData.save_id + ':title', title);
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

	drafts.updateVisibility =  function (set, save_id, add) {
		if (!canSave() || !save_id) {
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

	function canSave() {
		if (saving) {
			return saving;
		}

		try {
			localStorage.setItem('test', 'test');
			localStorage.removeItem('test');
			saving = true;
			return true;
		} catch(e) {
			saving = false;
			return false;
		}
	}

	return drafts;
});