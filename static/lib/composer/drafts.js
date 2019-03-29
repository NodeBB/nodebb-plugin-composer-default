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
	};

	function resetTimeout() {
		if (saveThrottleId) {
			clearTimeout(saveThrottleId);
			saveThrottleId = 0;
		}
	}

	drafts.getDraft = function(save_id) {
		return localStorage.getItem(save_id);
	};

	function saveDraft(postContainer, draftIconEl, postData) {
		var raw;

		if (canSave() && postData && postData.save_id && postContainer.length) {
			raw = postContainer.find('textarea').val();
			if (raw.length) {
				localStorage.setItem(postData.save_id, raw);
				draftIconEl.removeClass('active');
				setTimeout(function () {
					draftIconEl.addClass('active');
				});
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

		return localStorage.removeItem(save_id);
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