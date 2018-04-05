'use strict';

/* globals define */

define('composer/autocomplete', ['composer/preview'], function(preview) {

	var autocomplete = {};

	autocomplete.init = function(postContainer, post_uuid) {
		var element = postContainer.find('.write');
		var dropdownClass = 'composer-autocomplete-dropdown-' + post_uuid;
		var timer;

		var data = {
			element: element,
			strategies: [],
			options: {
				zIndex: 20000,
				dropdownClassName: dropdownClass + ' dropdown-menu textcomplete-dropdown',
			}
		};

		element.on('keyup', function () {
			clearTimeout(timer);
			timer = setTimeout(function () {
				var dropdown = document.querySelector('.' + dropdownClass);
				var pos = dropdown.getBoundingClientRect();

				var margin = parseFloat(dropdown.style.marginTop, 10) || 0;

				var offset = window.innerHeight + margin - 10 - pos.bottom;
				dropdown.style.marginTop = Math.min(offset, 0) + 'px';
			}, 0);
		});

		$(window).trigger('composer:autocomplete:init', data);
		data.element.textcomplete(data.strategies, data.options);
		$('.textcomplete-wrapper').css('height', '100%').find('textarea').css('height', '100%');

		data.element.on('textComplete:select', function() {
			preview.render(postContainer);
		});
	};

	return autocomplete;
});
