'use strict';

define('composer/preview', ['hooks'], function (hooks) {
	var preview = {};

	preview.render = function (postContainer, callback) {
		callback = callback || function () {};
		if (!postContainer.find('.preview-container').is(':visible')) {
			return callback();
		}

		var textarea = postContainer.find('textarea');

		socket.emit('plugins.composer.renderPreview', textarea.val(), function (err, preview) {
			if (err) {
				return;
			}
			preview = $('<div>' + preview + '</div>');
			preview.find('img:not(.not-responsive)').addClass('img-fluid');
			postContainer.find('.preview').html(preview);
			hooks.fire('action:composer.preview', { postContainer, preview });
			callback();
		});
	};

	preview.matchScroll = function (postContainer) {
		if (!postContainer.find('.preview-container').is(':visible')) {
			return;
		}
		var textarea = postContainer.find('textarea');
		var preview = postContainer.find('.preview');

		if (textarea.length && preview.length) {
			var diff = textarea[0].scrollHeight - textarea.height();

			if (diff === 0) {
				return;
			}

			var scrollPercent = textarea.scrollTop() / diff;

			preview.scrollTop(Math.max(preview[0].scrollHeight - preview.height(), 0) * scrollPercent);
		}
	};

	preview.handleToggler = function ($postContainer) {
		const postContainer = $postContainer.get(0);
		preview.env = utils.findBootstrapEnvironment();
		const isMobile = ['xs', 'sm'].includes(preview.env);
		const toggler = postContainer.querySelector('.formatting-bar [data-action="preview"]');
		const showText = toggler.querySelector('.show-text');
		const hideText = toggler.querySelector('.hide-text');
		const previewToggled = localStorage.getItem('composer:previewToggled');
		const hidePreviewOnOpen = config['composer-default'] && config['composer-default'].hidePreviewOnOpen === 'on';
		let show = !isMobile && (
			((previewToggled === null && !hidePreviewOnOpen) || previewToggled === 'true')
		);
		const previewContainer = postContainer.querySelector('.preview-container');
		const writeContainer = postContainer.querySelector('.write-container');

		if (!toggler) {
			return;
		}

		function togglePreview(show) {
			if (isMobile) {
				previewContainer.classList.toggle('hide', false);
				writeContainer.classList.toggle('maximized', false);

				previewContainer.classList.toggle('d-none', !show);
				previewContainer.classList.toggle('d-flex', show);
				previewContainer.classList.toggle('w-100', show);

				writeContainer.classList.toggle('d-flex', !show);
				writeContainer.classList.toggle('d-none', show);
				writeContainer.classList.toggle('w-100', !show);
			} else {
				previewContainer.classList.toggle('hide', !show);
				writeContainer.classList.toggle('w-50', show);
				writeContainer.classList.toggle('w-100', !show);
				localStorage.setItem('composer:previewToggled', show);
			}
			showText.classList.toggle('hide', show);
			hideText.classList.toggle('hide', !show);
			if (show) {
				preview.render($postContainer);
			}
			preview.matchScroll($postContainer);
		}
		preview.toggle = togglePreview;

		toggler.addEventListener('click', (e) => {
			if (e.button !== 0) {
				return;
			}

			show = !show;
			togglePreview(show);
		});

		togglePreview(show);
	};

	return preview;
});
