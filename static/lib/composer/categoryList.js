
'use strict';

/* globals define, app, $, window */

define('composer/categoryList', [
	'categorySelector', 'taskbar', 'api',
], function (categorySelector, taskbar, api) {
	var categoryList = {};

	var selector;

	categoryList.init = function (postContainer, postData) {
		var listContainer = postContainer.find('.category-list-container');
		if (!listContainer.length) {
			return;
		}

		postContainer.on('action:composer.resize', function () {
			toggleDropDirection(postContainer);
		});

		categoryList.updateTaskbar(postContainer, postData);

		app.parseAndTranslate('partials/category-selector', {}, function (html) {
			listContainer.append(html);
			selector = categorySelector.init(listContainer.find('[component="category-selector"]'), {
				privilege: 'topics:create',
				states: ['watching', 'notwatching', 'ignoring'],
				onSelect: function (selectedCategory) {
					if (postData.hasOwnProperty('cid')) {
						changeCategory(postContainer, postData, selectedCategory.cid);
					}
				},
			});

			if (postData.cid) {
				selector.selectCategory(postData.cid);
			}

			var selectedCategory = selector.getSelectedCategory();

			// this is the mobile category selector
			postContainer.find('.category-name')
				.translateText(selectedCategory ? selectedCategory.name : '[[modules:composer.select_category]]')
				.on('click', function () {
					categorySelector.modal({
						privilege: 'topics:create',
						states: ['watching', 'notwatching', 'ignoring'],
						openOnLoad: true,
						showLinks: false,
						onSelect: function (selectedCategory) {
							postContainer.find('.category-name').text(selectedCategory.name);
							selector.selectCategory(selectedCategory.cid);
							if (postData.hasOwnProperty('cid')) {
								changeCategory(postContainer, postData, selectedCategory.cid);
							}
						},
					});
				});

			toggleDropDirection(postContainer);
		});
	};

	function toggleDropDirection(postContainer) {
		postContainer.find('.category-list-container [component="category-selector"]').toggleClass('dropup', postContainer.outerHeight() < $(window).height() / 2);
	}

	categoryList.getSelectedCid = function () {
		var selectedCategory;
		if (selector) {
			selectedCategory = selector.getSelectedCategory();
		}
		return selectedCategory ? selectedCategory.cid : 0;
	};

	categoryList.updateTaskbar = function (postContainer, postData) {
		if (parseInt(postData.cid, 10)) {
			var uuid = postContainer.attr('data-uuid');
			api.get(`/categories/${postData.cid}`, {}).then(function (category) {
				if (category && category.icon) {
					taskbar.update('composer', uuid, {
						image: category.backgroundImage,
						'background-color': category.bgColor,
						icon: category.icon.slice(3),
					});
				}
			});
		}
	};

	function changeCategory(postContainer, postData, cid) {
		postData.cid = cid;

		require(['composer/tags'], function (tags) {
			tags.onChangeCategory(postContainer, postData, cid);
		});

		categoryList.updateTaskbar(postContainer, postData);
	}

	return categoryList;
});
