
'use strict';

/* globals define, $, window, ajaxify */

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

		selector = categorySelector.init(listContainer.find('[component="category-selector"]'), {
			privilege: 'topics:create',
			states: ['watching', 'notwatching', 'ignoring'],
			onSelect: function (selectedCategory) {
				if (postData.hasOwnProperty('cid')) {
					changeCategory(postContainer, postData, selectedCategory.cid);
				}
			},
		});
		if (!selector) {
			return;
		}
		if (postData.cid && ajaxify.data.template.category && parseInt(postData.cid, 10) === parseInt(ajaxify.data.cid, 10)) {
			selector.selectedCategory = { cid: postData.cid, name: ajaxify.data.name };
		} else if (ajaxify.data.template.compose && ajaxify.data.selectedCategory) {
			// separate composer route
			selector.selectedCategory = { cid: ajaxify.data.cid, name: ajaxify.data.selectedCategory };
		}

		// this is the mobile category selector
		postContainer.find('.category-name')
			.translateText(selector.selectedCategory ? selector.selectedCategory.name : '[[modules:composer.select_category]]')
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
