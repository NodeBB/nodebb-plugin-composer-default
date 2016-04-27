
'use strict';

/*globals define, socket, app*/

define('composer/categoryList', function() {
	var categoryList = {};

	categoryList.init = function(postContainer, postData) {
		var listEl = postContainer.find('.category-list');
		if (!listEl.length) {
			return;
		}

		socket.emit('categories.getCategoriesByPrivilege', 'topics:create', function(err, categories) {
			if (err) {
				return app.alertError(err.message);
			}

			// Remove categories that are just external links
			categories = categories.filter(function(category) {
				return !category.link;
			});

			var categoryMap = {};
			categories.forEach(function(category) {
				category.children = [];
				categoryMap[category.cid] = category;
			});

			categories.forEach(function(category) {
				if (category.parent) {
					var cid = category.parent.cid;
					if (!categoryMap[cid]) {
						categoryMap[cid] = category.parent;
						categoryMap[cid].noPrivilege = true;
					}
					categoryMap[cid].children = categoryMap[cid].children || [];
					categoryMap[cid].children.push(category);
				}
			});

			categories.length = 0;
			Object.keys(categoryMap).forEach(function(key) {
				if (!categoryMap[key].parent) {
					categories.push(categoryMap[key]);
				}
			});

			categories.forEach(function(category) {
				recursive(category, listEl, '');
			});

			if (postData.cid) {
				listEl.find('option[value="' + postData.cid + '"]').prop('selected', true);
			} else if (postData.hasOwnProperty('cid')) {
				postData.cid = listEl.val();
			}
		});

		listEl.on('change', function() {
			if (postData.hasOwnProperty('cid')) {
				postData.cid = this.value;
			}

			$('[tabindex=' + (parseInt($(this).attr('tabindex'), 10) + 1) + ']').trigger('focus');
		});
	};

	function recursive(category, listEl, level) {
		if (category.link) {
			return;
		}
		var bullet = level ? '&bull; ' : '';
		$('<option value="' + category.cid + '" ' + (category.noPrivilege ? 'disabled' : '') + '>' + level + bullet + category.name + '</option>').appendTo(listEl);

		category.children.forEach(function(child) {
			recursive(child, listEl, '&nbsp;&nbsp;&nbsp;&nbsp;' + level);
		});
	}

	return categoryList;
});
