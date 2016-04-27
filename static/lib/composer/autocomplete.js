'use strict';

/* globals define */

define('composer/autocomplete', ['composer/preview'], function(preview) {

	var autocomplete = {};

	autocomplete.init = function(postContainer) {
		var element = postContainer.find('.write');
		var data = {
			element: element,
			strategies: [],
			options: {
				zIndex: 20000,
				listPosition: function(position) {
					this.$el.css(this._applyPlacement(position));
					this.$el.css('position', 'absolute');
					return this;
				}
			}
		};

		$(window).trigger('composer:autocomplete:init', data);
		data.element.textcomplete(data.strategies, data.options);
		$('.textcomplete-wrapper').css('height', '100%').find('textarea').css('height', '100%');

		data.element.on('textComplete:select', function() {
			preview.render(postContainer);
		});
	};

	return autocomplete;
});
