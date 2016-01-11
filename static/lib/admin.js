'use strict';
/* globals $, app, socket */

define('admin/plugins/composer-default', ['settings'], function(Settings) {

	var ACP = {};

	ACP.init = function() {
		Settings.load('composer-default', $('.composer-default-settings'));

		$('#save').on('click', function() {
			Settings.save('composer-default', $('.composer-default-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'composer-default-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});
	};

	return ACP;
});