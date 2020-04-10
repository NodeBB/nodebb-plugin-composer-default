
'use strict';

/*globals define, socket, app*/

define('composer/categoryList', ['categorySelector'], function(categorySelector) {
	var categoryList = {};

	var selector;

	categoryList.init = function(postContainer, postData) {
		var listContainer = postContainer.find('.category-list-container');
		if (!listContainer.length) {
			return;
		}

		postContainer.on('action:composer.resize', function () {
			toggleDropDirection(postContainer);
		});

		socket.emit('plugins.composer.getCategoriesForSelect', {}, function(err, categories) {
			if (err) {
				return app.alertError(err.message);
			}
			// Save hash for queries
			categoryList._map = categories.reduce(function (memo, cur) {
				memo[cur.cid] = cur;
				return memo;
			}, {});

			categories.forEach(function (category) {
				if (!category.disabledClass) {
					$('<li data-cid="' + category.cid + '">' + category.name + '</li>').translateText(category.name).appendTo($('.category-selector'));
				}
			});

			app.parseAndTranslate('partials/category-selector', {
				categories: categories,
				pullRight: true
			}, function (html) {
				listContainer.append(html);
				selector = categorySelector.init(listContainer.find('[data-component="category-selector"]'), function (selectedCategory) {
					if (postData.hasOwnProperty('cid')) {
						changeCategory(postContainer, postData, selectedCategory.cid);
					}
				});

				if (postData.cid) {
					selector.selectCategory(postData.cid);
				}

				var selectedCategory = selector.getSelectedCategory();

				$('.category-name').translateText(selectedCategory ? selectedCategory.name : '[[modules:composer.select_category]]');
				$('.category-selector').find('li[data-cid="' + postData.cid + '"]').addClass('active');

				toggleDropDirection(postContainer);
			});
		});


		$('.category-selector').on('click', 'li', function() {
			$('.category-name').text($(this).text());
			$('.category-selector').removeClass('open');
			$('.category-selector li').removeClass('active');
			$(this).addClass('active');
			var selectedCid = $(this).attr('data-cid');
			selector.selectCategory(selectedCid);
			if (postData.hasOwnProperty('cid')) {
				changeCategory(postContainer, postData, selectedCid);
			}
		});
	};

	function toggleDropDirection(postContainer) {
		postContainer.find('.category-list-container [data-component="category-selector"]').toggleClass('dropup', postContainer.outerHeight() < $(window).height() / 2);
	}

	categoryList.getSelectedCid = function () {
		var selectedCategory;
		if (selector) {
			selectedCategory = selector.getSelectedCategory();
		}
		return selectedCategory ? selectedCategory.cid : 0;
	};

	function changeCategory(postContainer, postData, cid) {
		postData.cid = cid;

		require(['composer/tags'], function (tags) {
			tags.onChangeCategory(postContainer, postData, cid);
		});
	}

	return categoryList;
});
