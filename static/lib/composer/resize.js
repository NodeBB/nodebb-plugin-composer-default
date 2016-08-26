
'use strict';

/* globals define, utils*/

define('composer/resize', [], function() {
	var resize = {},
		oldPercentage = 0,
		minimumPercentage = 0.3,
		snapMargin = $('[component="navbar"]').height() / $(window).height();

	var $body = $('body'),
		$html = $('html'),
		$window = $(window),
		$headerMenu = $('[component="navbar"]');


	resize.reposition = function(postContainer) {
		var	percentage = localStorage.getItem('composer:resizePercentage') || 0.5;

		if (percentage >= 1 - snapMargin) {
			percentage = 1;
			postContainer.addClass('maximized');
		}

		doResize(postContainer, percentage);
	};

	resize.maximize = function(postContainer, state) {
		if (state) {
			doResize(postContainer, 1);
		} else {
			resize.reposition(postContainer);
		}
	};

	function doResize(postContainer, percentage) {
		var env = utils.findBootstrapEnvironment();

		if (env === 'sm' || env === 'xs' || env === 'md' || window.innerHeight < 480) {
			$html.addClass('composing mobile');
			percentage = 1;
		} else {
			$html.removeClass('composing mobile');
		}

		if (percentage) {
			var upperBound = getUpperBound();

			var windowHeight = $window.height();

			if (percentage < minimumPercentage) {
				percentage = minimumPercentage;
			} else if (percentage >= 1) {
				percentage = 1;
			}

			if (env === 'lg' || env === 'xl') {
				var top = percentage * (windowHeight - upperBound) / windowHeight;
				top = (Math.abs(1-top) * 100) + '%';
				postContainer.css({
					'top': top
				});
			} else {
				postContainer.removeAttr('style');
			}
		}

		postContainer.percentage = percentage;
		postContainer.css('visibility', 'visible');

		// Add some extra space at the bottom of the body so that the user can still scroll to the last post w/ composer open
		// thanks but don't do it on mobile
		if (env === 'lg' || env === 'xl') {
			$body.css({ 'margin-bottom': postContainer.outerHeight() });
		}

		resizeWritePreview(postContainer);
	}

	var resizeIt = doResize;

	var raf = window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame;

	if (raf) {
		resizeIt = function(postContainer, percentage) {
			raf(function() {
				doResize(postContainer, percentage);
			});
		};
	}

	resize.handleResize = function(postContainer) {

		function resizeStart(e) {
			var resizeRect = resizeEl[0].getBoundingClientRect(),
				resizeCenterY = resizeRect.top + (resizeRect.height / 2);

			resizeOffset = (resizeCenterY - e.clientY) / 2;
			resizeActive = true;
			resizeDown = e.clientY;

			$window.on('mousemove', resizeAction);
			$window.on('mouseup', resizeStop);
			$body.on('touchmove', resizeTouchAction);
		}

		function resizeStop(e) {
			resizeActive = false;

			postContainer.find('textarea').focus();
			$window.off('mousemove', resizeAction);
			$window.off('mouseup', resizeStop);
			$body.off('touchmove', resizeTouchAction);

			var position = (e.clientY - resizeOffset),
				windowHeight = $window.height(),
				upperBound = getUpperBound(),
				newHeight = windowHeight - position,
				ratio = newHeight / (windowHeight - upperBound);

			if (ratio >= 1 - snapMargin) {
				snapToTop = true;
			} else {
				snapToTop = false;
			}

			resizeSavePosition(ratio);

			toggleMaximize(e);
		}

		function toggleMaximize(e) {
			if (e.clientY - resizeDown === 0 || snapToTop) {
				var newPercentage = 1;

				if (!postContainer.hasClass('maximized') || !snapToTop) {
					oldPercentage = postContainer.percentage;
					resizeIt(postContainer, newPercentage);
					postContainer.addClass('maximized');
				} else {
					newPercentage = (oldPercentage >= 1 - snapMargin || oldPercentage == 0) ? 0.5 : oldPercentage;
					resizeIt(postContainer, newPercentage);
					postContainer.removeClass('maximized');
				}

				resizeSavePosition(newPercentage);
			}
		}

		function resizeTouchAction(e) {
			e.preventDefault();
			resizeAction(e.touches[0]);
		}

		function resizeAction(e) {
			if (resizeActive) {
				var position = (e.clientY - resizeOffset),
					windowHeight = $window.height(),
					upperBound = getUpperBound(),
					newHeight = windowHeight - position,
					ratio = newHeight / (windowHeight - upperBound);

				resizeIt(postContainer, ratio);

				resizeWritePreview(postContainer);

				if (Math.abs(e.clientY - resizeDown) > 0) {
					postContainer.removeClass('maximized');
				}
			}

			e.preventDefault();
			return false;
		}

		function resizeSavePosition(percentage) {
			localStorage.setItem('composer:resizePercentage', percentage <= 1 ? percentage : 1);
		}

		var	resizeActive = false,
			resizeOffset = 0,
			resizeDown = 0,
			snapToTop = false,
			resizeEl = postContainer.find('.resizer');

		resizeEl
			.on('mousedown', resizeStart)
			.on('touchstart', function(e) {
				e.preventDefault();
				resizeStart(e.touches[0]);
			})
			.on('touchend', function(e) {
				e.preventDefault();
				resizeStop();
			});
	};

	function getUpperBound() {
		try {
			var rect = $headerMenu.get(0).getBoundingClientRect();
			return rect.height + rect.top;
		} catch (e) {
			return 0;
		}
	}

	function resizeWritePreview(postContainer) {
		var total = getFormattingHeight(postContainer),
			containerHeight = postContainer.height() + 20 - total;

		postContainer
			.find('.write-preview-container')
			.css('height', containerHeight);

		$window.trigger('action:composer.resize', {
			formattingHeight: total,
			containerHeight: containerHeight
		});
	}

	function getFormattingHeight(postContainer) {
		return [
			postContainer.find('.title-container').outerHeight(true),
			postContainer.find('.formatting-bar').outerHeight(true),
			postContainer.find('.topic-thumb-container').outerHeight(true) || 0,
			postContainer.find('.tag-row').outerHeight(true) || 0,
			$('.taskbar').height() || 50
		].reduce(function(a, b) {
			return a + b;
		});
	}

	return resize;
});
