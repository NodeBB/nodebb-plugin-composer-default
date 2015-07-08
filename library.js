"use strict";

var SocketPlugins = require.main.require('./src/socket.io/plugins'),
	socketMethods = require('./websockets'),

	plugin = {
		socketMethods: socketMethods
	};

plugin.init = function(data, callback) {
	SocketPlugins.composer = socketMethods;

	callback();
}

module.exports = plugin;