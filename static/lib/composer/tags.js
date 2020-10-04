
'use strict';

/*globals ajaxify, define, config, socket, app, utils*/

define('composer/tags', [ 'autocomplete' ], function(autocomplete) {
	var tags = {};

	var tagsinputEl;
	var minTags;
	var maxTags;

	tags.init = function(postContainer, postData) {
		var tagEl = postContainer.find('.tags');
		if (!tagEl.length) {
			return;
		}

		minTags = ajaxify.data.hasOwnProperty('minTags') ? ajaxify.data.minTags : config.minimumTagsPerTopic;
		maxTags = ajaxify.data.hasOwnProperty('maxTags') ? ajaxify.data.maxTags : config.maximumTagsPerTopic;

		var tagsinput = tagEl.tagsinput({
			confirmKeys: [13, 44],
			trimValue: true
		});
		tagsinputEl = tagsinput[0];

		tagEl.on('beforeItemAdd', function(event) {
			var reachedMaxTags = maxTags && maxTags <= tags.getTags(postContainer.attr('data-uuid')).length;
			var cleanTag = utils.cleanUpTag(event.item, config.maximumTagLength);
			var different = cleanTag !== event.item;
			event.cancel = different ||
				event.item.length < config.minimumTagLength ||
				event.item.length > config.maximumTagLength ||
				reachedMaxTags;

			if (event.item.length < config.minimumTagLength) {
				return app.alertError('[[error:tag-too-short, ' + config.minimumTagLength + ']]');
			} else if (event.item.length > config.maximumTagLength) {
				return app.alertError('[[error:tag-too-long, ' + config.maximumTagLength + ']]');
			} else if (reachedMaxTags) {
				return app.alertError('[[error:too-many-tags, ' + maxTags + ']]');
			}
			if (different) {
				tagEl.tagsinput('add', cleanTag);
			}
		});

		tagEl.on('itemAdded', function(event) {
			var cid = postData.hasOwnProperty('cid') ? postData.cid : ajaxify.data.cid;
			socket.emit('topics.isTagAllowed', { tag: event.item, cid: cid || 0 }, function(err, allowed) {
				if (err) {
					return app.alertError(err.message);
				}
				if (!allowed) {
					return tagEl.tagsinput('remove', event.item);
				}
				$(window).trigger('action:tag.added', { cid: cid, tagEl: tagEl, tag: event.item });
				input.autocomplete('close');
			});
		});

		addTags(postData.tags, tagEl);

		var input = postContainer.find('.bootstrap-tagsinput input');
		toggleTagInput(postContainer, postData, ajaxify.data);

		autocomplete.tag(input);

		input.attr('tabIndex', tagEl.attr('tabIndex'));
		input.on('blur', function() {
			triggerEnter(input);
		});

		$('[component="composer/tag/dropdown"]').on('click', 'li', function () {
			var tag = $(this).attr('data-tag');
			if (tag) {
				addTags([tag], tagEl);
			}
			return false;
		});
	};

	tags.isEnoughTags = function (post_uuid) {
		return tags.getTags(post_uuid).length >= minTags;
	};

	tags.minTagCount = function () {
		return minTags;
	};

	tags.onChangeCategory = function (postContainer, postData, cid) {
		$.get(config.relative_path + '/api/category/' + cid, function (data) {
			var tagDropdown = postContainer.find('[component="composer/tag/dropdown"]');
			if (!tagDropdown.length) {
				return;
			}

			toggleTagInput(postContainer, postData, data);
			tagDropdown.toggleClass('hidden', !data.tagWhitelist || !data.tagWhitelist.length);
			if (data.tagWhitelist) {
				app.parseAndTranslate('composer', 'tagWhitelist', { tagWhitelist: data.tagWhitelist }, function (html) {
					tagDropdown.find('.dropdown-menu').html(html);
				});
			}
		});
	};

	function toggleTagInput(postContainer, postData, data) {
		var tagEl = postContainer.find('.tags');
		var input = postContainer.find('.bootstrap-tagsinput input');
		if (!input.length) {
			return;
		}

		if (data.hasOwnProperty('minTags')) {
			minTags = data.minTags;
		}
		if (data.hasOwnProperty('maxTags')) {
			maxTags = data.maxTags;
		}

		if (data.tagWhitelist && data.tagWhitelist.length) {
			input.attr('readonly', '');
			input.attr('placeholder', '');

			tagEl.tagsinput('items').slice().forEach(function (tag) {
				if (data.tagWhitelist.indexOf(tag) === -1) {
					tagEl.tagsinput('remove', tag);
				}
			});
		} else {
			input.removeAttr('readonly');
			input.attr('placeholder', postContainer.find('input.tags').attr('placeholder'));
		}

		postContainer.find('.tags-container').toggleClass('hidden', (
			data.privileges && data.privileges.hasOwnProperty('topics:tag') && !data.privileges['topics:tag']) ||
			(maxTags === 0 && !postData.tags.length)
		);

		if (data.privileges && data.privileges.hasOwnProperty('topics:tag') && !data.privileges['topics:tag']) {
			tagEl.tagsinput('removeAll');
		}

		$(window).trigger('action:tag.toggleInput', {
			postContainer: postContainer,
			tagWhitelist: data.tagWhitelist,
			tagsInput: input,
		});
	}

	function triggerEnter(input) {
		// http://stackoverflow.com/a/3276819/583363
		var e = jQuery.Event('keypress');
		e.which = 13;
		e.keyCode = 13;
		setTimeout(function() {
			input.trigger(e);
		}, 100);
	}

	function addTags(tags, tagEl) {
		if (tags && tags.length) {
			for (var i=0; i<tags.length; ++i) {
				tagEl.tagsinput('add', tags[i]);
			}
		}
	}

	tags.getTags = function(post_uuid) {
		return $('.composer[data-uuid="' + post_uuid + '"]' + ' .tags').tagsinput('items');
	};

	return tags;
});
