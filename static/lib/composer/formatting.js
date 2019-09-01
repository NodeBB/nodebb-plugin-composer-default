'use strict';

/* globals app, define, screenfull */

define('composer/formatting', ['composer/controls', 'composer/preview', 'composer/resize'], function(controls, preview, resize) {

	var formatting = {};

	var formattingDispatchTable = {
		picture: function () {
			var postContainer = this;
			postContainer.find('#files').click();
		},

		upload: function () {
			var postContainer = this;
			postContainer.find('#files').click();
		},

		tags: function() {
			var postContainer = this;
			postContainer.find('.tags-container').toggleClass('hidden');
		},

		zen: function() {
			var postContainer = this;
			$(window).one('resize', function() {
				function onResize() {
					if (!screenfull.isFullscreen) {
						app.toggleNavbar(true);
						$('html').removeClass('zen-mode');
						resize.reposition(postContainer);
						$(window).off('resize', onResize);
					}
				}

				if (screenfull.isFullscreen) {
					app.toggleNavbar(false);
					$('html').addClass('zen-mode');
					postContainer.find('.write').focus();

					$(window).on('resize', onResize);

					$(window).one('action:composer.topics.post action:composer.posts.reply action:composer.posts.edit action:composer.discard', screenfull.exit);
				}
			});

			screenfull.toggle();
		}
	};

	var buttons = [];

	formatting.addComposerButtons = function() {
		for(var x=0,numButtons=buttons.length;x<numButtons;x++) {
			$('.formatting-bar .formatting-group #fileForm').before('<li tabindex="-1" data-format="' + buttons[x].name + '" title="' + (buttons[x].title || '') + '"><i class="' + buttons[x].iconClass + '"></i></li>');
		}
	};

	formatting.addButton = function(iconClass, onClick, title, name) {
		var name = name || iconClass.replace('fa fa-', '');

		formattingDispatchTable[name] = onClick;
		buttons.push({
			name: name,
			iconClass: iconClass,
			title: title
		});
	};

	formatting.getDispatchTable = function () {
		return formattingDispatchTable;
	};

	formatting.addButtonDispatch = function(name, onClick) {
		formattingDispatchTable[name] = onClick;
	};

	formatting.addHandler = function(postContainer) {
		postContainer.on('click', '.formatting-bar li', function (event) {
			var format = $(this).attr('data-format'),
				textarea = $(this).parents('[component="composer"]').find('textarea')[0];

			if(formattingDispatchTable.hasOwnProperty(format)){
				formattingDispatchTable[format].call(postContainer, textarea, textarea.selectionStart, textarea.selectionEnd, event);
				preview.render(postContainer);
			}
		});
	};

	return formatting;
});
