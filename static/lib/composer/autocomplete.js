'use strict';

define('composer/autocomplete', [
	'composer/preview', 'autocomplete',
], function (preview, Autocomplete) {
	var autocomplete = {
		_active: {},
	};

	$(window).on('action:composer.discard', function (evt, data) {
		if (autocomplete._active.hasOwnProperty(data.post_uuid)) {
			autocomplete._active[data.post_uuid].destroy();
			delete autocomplete._active[data.post_uuid];
		}
	});

	autocomplete.init = function (postContainer, post_uuid) {
		var element = postContainer.find('.write');
		var dropdownClass = 'composer-autocomplete-dropdown-' + post_uuid;
		var timer;

		if (!element.length) {
			/**
			 * Some composers do their own thing before calling autocomplete.init() again.
			 * One reason is because they want to override the textarea with their own element.
			 * In those scenarios, they don't specify the "write" class, and this conditional
			 * looks for that and stops the autocomplete init process.
			 */
			return;
		}

		var data = {
			element: element,
			strategies: [],
			options: {
				style: {
					'z-index': 20000,
				},
				className: dropdownClass + ' dropdown-menu textcomplete-dropdown',
			},
		};

		element.on('keyup', function () {
			clearTimeout(timer);
			timer = setTimeout(function () {
				var dropdown = document.querySelector('.' + dropdownClass);
				if (dropdown) {
					var pos = dropdown.getBoundingClientRect();

					var margin = parseFloat(dropdown.style.marginTop, 10) || 0;

					var offset = window.innerHeight + margin - 10 - pos.bottom;
					dropdown.style.marginTop = Math.min(offset, 0) + 'px';
				}
			}, 0);
		});

		$(window).trigger('composer:autocomplete:init', data);

		autocomplete._active[post_uuid] = Autocomplete.setup(data);

		data.element.on('textComplete:select', function () {
			preview.render(postContainer);
		});
	};

	return autocomplete;
});
