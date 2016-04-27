
'use strict';

/*globals define, config, socket, app*/

define('plugins/nodebb-plugin-composer-default/js/composer/categoryList', function() {
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
				return !category.link && !parseInt(category.parentCid, 10);
			});

			categories.forEach(function(category) {
				recursive(category, listEl, '');
			});

			if (postData.cid) {
				listEl.find('option[value="' + postData.cid + '"]').prop('selected', true);
			}
		});

		listEl.on('change', function() {
			if (postData.cid) {
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
		$('<option value="' + category.cid + '">' + level + bullet + category.name + '</option>').appendTo(listEl);

		category.children.forEach(function(child) {
			recursive(child, listEl, '&nbsp;&nbsp;&nbsp;&nbsp;' + level);
		});
	}

	return categoryList;
});
