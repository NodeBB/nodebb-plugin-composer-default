'use strict';

/* globals define */

define('composer/autocomplete', function() {

	var autocomplete = {};

	autocomplete.init = function(postContainer) {
		var data = {
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
		postContainer.find('.write').textcomplete(data.strategies, data.options);
		$('.textcomplete-wrapper').css('height', '100%').find('textarea').css('height', '100%');
	};

	return autocomplete;
});