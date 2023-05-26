'use strict';

define('admin/plugins/composer-default', ['settings'], function (Settings) {
	const ACP = {};

	ACP.init = function () {
		Settings.load('composer-default', $('.composer-default-settings'));

		$('#save').on('click', function () {
			Settings.save('composer-default', $('.composer-default-settings'));
		});
	};

	return ACP;
});
