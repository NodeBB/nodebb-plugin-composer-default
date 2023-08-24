'use strict';

define('composer/post-queue', [], function () {
	const postQueue = {};

	postQueue.showAlert = async function (postContainer, postData) {
		if (!config.postQueue || app.user.isAdmin || app.user.isGlobalMod || app.user.isMod) {
			return;
		}
		const shouldQueue = await socket.emit('plugins.composer.shouldQueue', { postData: postData });
		postContainer.find('[component="composer/post-queue/alert"]')
			.toggleClass('show', shouldQueue);
	};

	postQueue.onChangeCategory = async function (postContainer, postData) {
		if (!config.postQueue) {
			return;
		}
		postQueue.showAlert(postContainer, postData);
	};

	return postQueue;
});
