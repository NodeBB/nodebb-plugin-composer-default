
'use strict';

/*globals ajaxify, define, config, socket, app, utils*/

define('composer/tags', function() {
	var tags = {};

	tags.init = function(postContainer, postData) {
		var tagEl = postContainer.find('.tags');
		if (!tagEl.length) {
			return;
		}

		tagEl.tagsinput({
			maxTags: config.maximumTagsPerTopic,
			maxChars: config.maximumTagLength,
			confirmKeys: [13, 44],
			trimValue: true
		});

		tagEl.on('beforeItemAdd', function(event) {
			var cleanTag = utils.cleanUpTag(event.item, config.maximumTagLength);
			var different = cleanTag !== event.item;
			event.cancel = different || event.item.length < config.minimumTagLength || event.item.length > config.maximumTagLength;
			if (event.item.length < config.minimumTagLength) {
				return app.alertError('[[error:tag-too-short, ' + config.minimumTagLength + ']]');
			} else if (event.item.length > config.maximumTagLength) {
				return app.alertError('[[error:tag-too-long, ' + config.maximumTagLength + ']]');
			}
			if (different) {
				tagEl.tagsinput('add', cleanTag);
			}
		});

		tagEl.on('itemAdded', function(event) {
			var cid = postData.hasOwnProperty('cid') ? postData.cid : ajaxify.data.cid;
			socket.emit('topics.isTagAllowed', {tag: event.item, cid: cid}, function(err, allowed) {
				if (err || !allowed) {
					return tagEl.tagsinput('remove', event.item);
				}
				$(window).trigger('action:tag.added', {cid: cid, tagEl: tagEl, tag: event.item});
			});
		});

		addTags(postData.tags, tagEl);

		var input = postContainer.find('.bootstrap-tagsinput input');
		toggleTagInput(postContainer, ajaxify.data.tagWhitelist);

		app.loadJQueryUI(function() {
			input.autocomplete({
				delay: 100,
				position: { my: "left bottom", at: "left top", collision: "flip" },
				open: function() {
					$(this).autocomplete('widget').css('z-index', 20000);
				},
				source: function(request, response) {
					socket.emit('topics.autocompleteTags', {query: request.term, cid: postData.cid}, function(err, tags) {
						if (err) {
							return app.alertError(err.message);
						}
						if (tags) {
							response(tags);
						}
						$('.ui-autocomplete a').attr('data-ajaxify', 'false');
					});
				},
				select: function(event, ui) {
					// when autocomplete is selected from the dropdown simulate a enter key down to turn it into a tag
					triggerEnter(input);
				}
			});
		});

		input.attr('tabIndex', tagEl.attr('tabIndex'));
		input.attr('size', tagEl.attr('placeholder').length);
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

	tags.updateWhitelist = function (postContainer, cid) {
		$.get('/api/category/' + cid, function (data) {
			var tagDropdown = postContainer.find('[component="composer/tag/dropdown"]');
			if (!tagDropdown.length) {
				return;
			}
			toggleTagInput(postContainer, data.tagWhitelist);
			tagDropdown.toggleClass('hidden', !data.tagWhitelist.length);
			app.parseAndTranslate('composer', 'tagWhitelist', {tagWhitelist: data.tagWhitelist}, function (html) {
				tagDropdown.find('.dropdown-menu').html(html);
			});
		});
	};

	function toggleTagInput(postContainer, tagWhitelist) {
		var input = postContainer.find('.bootstrap-tagsinput input');
		if (!input.length) {
			return;
		}
		if (tagWhitelist && tagWhitelist.length) {
			input.attr('readonly', '');
			input.attr('placeholder', '');
		} else {
			input.removeAttr('readonly');
			input.attr('placeholder', postContainer.find('input.tags').attr('placeholder'));
		}
		$(window).trigger('action:tag.toggleInput', {
			postContainer: postContainer,
			tagWhitelist: tagWhitelist,
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
		return $('#cmp-uuid-' + post_uuid + ' .tags').tagsinput('items');
	};

	return tags;
});
