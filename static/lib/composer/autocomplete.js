'use strict';

/* globals define */

define('plugins/nodebb-plugin-composer-default/js/composer/autocomplete', [
	'plugins/nodebb-plugin-composer-default/js/composer/preview'
], function(preview) {

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
