'use strict';

/* globals define */

define('composer/autocomplete', ['composer/preview'], function(preview) {

	var autocomplete = {
		_active: {},
	};

	$(window).on('action:composer.discard', function (evt, data) {
		if (autocomplete._active.hasOwnProperty(data.post_uuid)) {
			autocomplete._active[data.post_uuid].destroy();
			delete autocomplete._active[data.post_uuid];
		}
	});

	autocomplete.init = function(postContainer, post_uuid) {
		var element = postContainer.find('.write');
		var dropdownClass = 'composer-autocomplete-dropdown-' + post_uuid;

		if (!element.length) {
			/**
			 * Some composers do their own thing before calling autocomplete.init() again.
			 * One reason is because they want to override the textarea with their own element.
			 * In those scenarios, they don't specify the "write" class, and this conditional
			 * looks for that and stops the autocomplete init process.
			 **/
			return;
		}

		var data = {
			element: element,
			strategies: [],
			options: {
				placement: 'auto',
				style: {
					'z-index': 20000,
				},
				className: dropdownClass + ' dropdown-menu textcomplete-dropdown',
			}
		};

		$(window).trigger('composer:autocomplete:init', data);

		autocomplete._active[post_uuid] = autocomplete.setup(data);

		data.element.on('textComplete:select', function() {
			preview.render(postContainer);
		});
	};

	// This is a generic method that is also used by the chat
	autocomplete.setup = function (data) {
		var element = data.element.get(0);
		if (!element) {
			return;
		}
		var editor;
		if (element.nodeName === 'TEXTAREA') {
			var Textarea = window.Textcomplete.editors.Textarea;
			editor = new Textarea(element);
		} else if (element.nodeName === 'DIV' && element.getAttribute('contenteditable') === 'true') {
			var ContentEditable = window.Textcomplete.editors.ContentEditable;
			editor = new ContentEditable(element);
		}

		// yuku-t/textcomplete inherits directionality from target element itself
		element.setAttribute('dir', document.querySelector('html').getAttribute('data-dir'));

		var textcomplete = new window.Textcomplete(editor, {
			dropdown: data.options,
		});

		// hack till https://github.com/yuku/textcomplete/issues/166
		var _getCursorOffset = editor.getCursorOffset;
		editor.getCursorOffset = function () {
			var offset = _getCursorOffset.apply(editor, arguments);
			offset.clientTop = offset.top;
			return offset;
		};

		textcomplete.register(data.strategies);
		textcomplete.on('rendered', function () {
			if (textcomplete.dropdown.items.length) {
				// Activate the first item by default.
				textcomplete.dropdown.items[0].activate();
			}
		});

		return textcomplete;
	};

	return autocomplete;
});
