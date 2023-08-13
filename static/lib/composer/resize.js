
'use strict';

define('composer/resize', ['taskbar'], function (taskbar) {
	var resize = {};
	var oldRatio = 0;
	var minimumRatio = 0.3;
	var snapMargin = 0.05;
	var smallMin = 768;

	var $body = $('body');
	var $window = $(window);
	var $headerMenu = $('[component="navbar"]');
	const content = document.getElementById('content');

	var header = $headerMenu[0];

	function getSavedRatio() {
		return localStorage.getItem('composer:resizeRatio') || 0.5;
	}

	function saveRatio(ratio) {
		localStorage.setItem('composer:resizeRatio', Math.min(ratio, 1));
	}

	function getBounds() {
		var headerRect;
		if (header) {
			headerRect = header.getBoundingClientRect();
		} else {
			// Mock data
			headerRect = { bottom: 0 };
		}

		var headerBottom = Math.max(headerRect.bottom, 0);

		var rect = {
			top: 0,
			left: 0,
			right: window.innerWidth,
			bottom: window.innerHeight,
		};

		rect.width = rect.right;
		rect.height = rect.bottom;

		rect.boundedTop = headerBottom;
		rect.boundedHeight = rect.bottom - headerBottom;

		return rect;
	}

	function doResize(postContainer, ratio) {
		var bounds = getBounds();
		var elem = postContainer[0];
		var style = window.getComputedStyle(elem);

		// Adjust minimumRatio for shorter viewports
		var minHeight = parseInt(style.getPropertyValue('min-height'), 10);
		var adjustedMinimum = Math.max(minHeight / window.innerHeight, minimumRatio);

		if (bounds.width >= smallMin) {
			const boundedDifference = (bounds.height - bounds.boundedHeight) / bounds.height;
			ratio = Math.min(Math.max(ratio, adjustedMinimum + boundedDifference), 1);

			var top = ratio * bounds.boundedHeight / bounds.height;
			elem.style.top = ((1 - top) * 100).toString() + '%';

			// Add some extra space at the bottom of the body so that
			// the user can still scroll to the last post w/ composer open
			var rect = elem.getBoundingClientRect();
			content.style.paddingBottom = (rect.bottom - rect.top).toString() + 'px';
		} else {
			elem.style.top = 0;
			content.style.paddingBottom = 0;
		}

		postContainer.ratio = ratio;

		taskbar.updateActive(postContainer.attr('data-uuid'));
	}

	var resizeIt = doResize;
	var raf = window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame;

	if (raf) {
		resizeIt = function (postContainer, ratio) {
			raf(function () {
				doResize(postContainer, ratio);

				setTimeout(function () {
					$window.trigger('action:composer.resize');
					postContainer.trigger('action:composer.resize');
				}, 0);
			});
		};
	}

	resize.reposition = function (postContainer) {
		var ratio = getSavedRatio();

		if (ratio >= 1 - snapMargin) {
			ratio = 1;
			postContainer.addClass('maximized');
		}

		resizeIt(postContainer, ratio);
	};

	resize.maximize = function (postContainer, state) {
		if (state) {
			resizeIt(postContainer, 1);
		} else {
			resize.reposition(postContainer);
		}
	};

	resize.handleResize = function (postContainer) {
		var resizeOffset = 0;
		var resizeBegin = 0;
		var resizeEnd = 0;
		var $resizer = postContainer.find('.resizer');
		var resizer = $resizer[0];

		function resizeStart(e) {
			var resizeRect = resizer.getBoundingClientRect();
			var resizeCenterY = (resizeRect.top + resizeRect.bottom) / 2;

			resizeOffset = (resizeCenterY - e.clientY) / 2;
			resizeBegin = e.clientY;

			$window.on('mousemove', resizeAction);
			$window.on('mouseup', resizeStop);
			$body.on('touchmove', resizeTouchAction);
		}

		function resizeAction(e) {
			var position = e.clientY - resizeOffset;
			var bounds = getBounds();
			var ratio = (bounds.height - position) / (bounds.boundedHeight);

			resizeIt(postContainer, ratio);
		}

		function resizeStop(e) {
			e.preventDefault();
			resizeEnd = e.clientY;

			postContainer.find('textarea').focus();
			$window.off('mousemove', resizeAction);
			$window.off('mouseup', resizeStop);
			$body.off('touchmove', resizeTouchAction);

			var position = resizeEnd - resizeOffset;
			var bounds = getBounds();
			var ratio = (bounds.height - position) / (bounds.boundedHeight);

			if (resizeEnd - resizeBegin === 0 && postContainer.hasClass('maximized')) {
				postContainer.removeClass('maximized');
				ratio = (!oldRatio || oldRatio >= 1 - snapMargin) ? 0.5 : oldRatio;
				resizeIt(postContainer, ratio);
			} else if (resizeEnd - resizeBegin === 0 || ratio >= 1 - snapMargin) {
				resizeIt(postContainer, 1);
				postContainer.addClass('maximized');
				oldRatio = ratio;
			} else {
				postContainer.removeClass('maximized');
			}

			saveRatio(ratio);
		}

		function resizeTouchAction(e) {
			e.preventDefault();
			resizeAction(e.touches[0]);
		}

		$resizer
			.on('mousedown', function (e) {
				if (e.button !== 0) {
					return;
				}

				e.preventDefault();
				resizeStart(e);
			})
			.on('touchstart', function (e) {
				e.preventDefault();
				resizeStart(e.touches[0]);
			})
			.on('touchend', resizeStop);
	};

	return resize;
});
