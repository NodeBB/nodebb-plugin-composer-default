
'use strict';

/* globals app, define, config, utils*/

define('composer/resize', ['autosize'], function(autosize) {
	var resize = {},
		oldPercentage = 0,
		minimumPercentage = 0.3,
		snapMargin = 1/15;

	var $body = $('body'),
		$html = $('html'),
		$window = $(window),
		$headerMenu = $('#header-menu');

	resize.reposition = function(postContainer) {
		var	percentage = localStorage.getItem('composer:resizePercentage') || 0.5;

		if (percentage >= 1 - snapMargin) {
			postContainer.addClass('maximized');
		}

		doResize(postContainer, percentage);
	};

	function doResize(postContainer, percentage, realPercentage) {
		var env = utils.findBootstrapEnvironment();


		// todo, lump in browsers that don't support transform (ie8) here
		// at this point we should use modernizr

		// done, just use `top` instead of `translate`

		if (env === 'sm' || env === 'xs' || window.innerHeight < 480) {
			$html.addClass('composing mobile');
			autosize(postContainer.find('textarea')[0]);
			percentage = 1;
		} else {
			$html.removeClass('composing mobile');

			if (percentage) {
				var upperBound = getUpperBound();

				var windowHeight = window.innerHeight;

				if (percentage < minimumPercentage) {
					percentage = minimumPercentage;
				} else if (percentage >= 1) {
					percentage = 1;
				}

				var top;
				if (realPercentage) {
					top = realPercentage;
				} else {
					top = percentage * (windowHeight - upperBound) / windowHeight;
				}
				top = (Math.abs(1-top) * 100) + '%';

				postContainer[0].style.top = top;

				// Add some extra space at the bottom of the body so that the user can still scroll to the last post w/ composer open
				$body[0].style.marginBottom = postContainer.height() + 20 + 'px';
			}

		}

		postContainer.percentage = percentage;

		if (config.hasImageUploadPlugin) {
			postContainer.find('.img-upload-btn').removeClass('hide');
			postContainer.find('#files.lt-ie9').removeClass('hide');
		}

		if (config.allowFileUploads) {
			postContainer.find('.file-upload-btn').removeClass('hide');
			postContainer.find('#files.lt-ie9').removeClass('hide');
		}

		postContainer[0].style.visibility = 'visible';

		$window.trigger('action:composer.resize');
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
				windowHeight = window.innerHeight,
				upperBound = getUpperBound(),
				newHeight = windowHeight - position,
				percentage = newHeight / (windowHeight - upperBound);

			if (percentage >= 1 - snapMargin) {
				snapToTop = true;
			} else {
				snapToTop = false;
			}

			resizeSavePosition(percentage);

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
					resizeIt(postContainer, (oldPercentage >= 1 - snapMargin) ? 0.5 : oldPercentage);
					postContainer.removeClass('maximized');
				}
			}
		}

		function resizeTouchAction(e) {
			e.preventDefault();
			resizeAction(e.touches[0]);
		}

		function resizeAction(e) {
			if (resizeActive) {
				var position = (e.clientY - resizeOffset),
					windowHeight = window.innerHeight,
					upperBound = getUpperBound(),
					newHeight = windowHeight - position,
					percentage = newHeight / (windowHeight - upperBound);

				resizeIt(postContainer, percentage, newHeight / windowHeight);

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
		return $headerMenu[0].getBoundingClientRect().bottom;
	}

	return resize;
});
