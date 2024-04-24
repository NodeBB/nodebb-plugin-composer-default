'use strict';

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
			states: ['watching', 'tracking', 'notwatching', 'ignoring'],
			onSelect: function (selectedCategory) {
				if (postData.hasOwnProperty('cid')) {
					changeCategory(postContainer, postData, selectedCategory);
				}
			},
		});
		if (!selector) {
			return;
		}
		if (postData.cid && postData.category) {
			selector.selectedCategory = { cid: postData.cid, name: postData.category.name };
		} else if (ajaxify.data.template.compose && ajaxify.data.selectedCategory) {
			// separate composer route
			selector.selectedCategory = { cid: ajaxify.data.cid, name: ajaxify.data.selectedCategory };
		}

		// this is the mobile category selector
		postContainer.find('.category-name')
			.translateHtml(selector.selectedCategory ? selector.selectedCategory.name : '[[modules:composer.select-category]]')
			.on('click', function () {
				categorySelector.modal({
					privilege: 'topics:create',
					states: ['watching', 'tracking', 'notwatching', 'ignoring'],
					openOnLoad: true,
					showLinks: false,
					onSubmit: function (selectedCategory) {
						postContainer.find('.category-name').text(selectedCategory.name);
						selector.selectCategory(selectedCategory.cid);
						if (postData.hasOwnProperty('cid')) {
							changeCategory(postContainer, postData, selectedCategory);
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
			api.get(`/categories/${postData.cid}`, {}).then(function (category) {
				updateTaskbarByCategory(postContainer, category);
			});
		}
	};

	function updateTaskbarByCategory(postContainer, category) {
		if (category) {
			var uuid = postContainer.attr('data-uuid');
			taskbar.update('composer', uuid, {
				image: category.backgroundImage,
				color: category.color,
				'background-color': category.bgColor,
				icon: category.icon && category.icon.slice(3),
			});
		}
	}

	async function changeCategory(postContainer, postData, selectedCategory) {
		postData.cid = selectedCategory.cid;
		const categoryData = await window.fetch(`${config.relative_path}/api/category/${selectedCategory.cid}`).then(r => r.json());
		postData.category = categoryData;
		updateTaskbarByCategory(postContainer, categoryData);
		require(['composer/scheduler', 'composer/tags', 'composer/post-queue'], function (scheduler, tags, postQueue) {
			scheduler.onChangeCategory(categoryData);
			tags.onChangeCategory(postContainer, postData, selectedCategory.cid, categoryData);
			postQueue.onChangeCategory(postContainer, postData);

			$(window).trigger('action:composer.changeCategory', {
				postContainer: postContainer,
				postData: postData,
				selectedCategory: selectedCategory,
				categoryData: categoryData,
			});
		});
	}

	return categoryList;
});
