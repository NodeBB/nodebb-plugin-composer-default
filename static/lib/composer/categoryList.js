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
		categorySelector.init(
			postContainer.find('.mobile-navbar [component="category-selector"]'), {
				privilege: 'topics:create',
				states: ['watching', 'tracking', 'notwatching', 'ignoring'],
				onSelect: function (selectedCategory) {
					if (postData.hasOwnProperty('cid')) {
						changeCategory(postContainer, postData, selectedCategory);
					}
				},
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

	function updateTopicTemplate(postContainer, category, previousCategory) {
		const currentText = postContainer.find('textarea.write').val();
		const previousTopicTemplate = previousCategory && previousCategory.topicTemplate;
		if (category && (!currentText.length || currentText === previousTopicTemplate) &&
			currentText !== category.topicTemplate) {
			postContainer.find('textarea.write').val(category.topicTemplate).trigger('input');
		}
	}

	async function changeCategory(postContainer, postData, selectedCategory) {
		const previousCategory = postData.category;
		postData.cid = selectedCategory.cid;
		const categoryData = await window.fetch(`${config.relative_path}/api/category/${encodeURIComponent(selectedCategory.cid)}`).then(r => r.json());
		postData.category = categoryData;
		updateTaskbarByCategory(postContainer, categoryData);
		updateTopicTemplate(postContainer, categoryData, previousCategory);

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
