'use strict';

define('composer/post-queue', [], function () {
	const postQueue = {};

	postQueue.showAlert = async function (postContainer, postData) {
		const alertEl = postContainer.find('[component="composer/post-queue/alert"]')
		if (!config.postQueue || app.user.isAdmin || app.user.isGlobalMod || app.user.isMod) {
			alertEl.remove();
			return;
		}
		const shouldQueue = await socket.emit('plugins.composer.shouldQueue', { postData: postData });
		alertEl.toggleClass('show', shouldQueue);
		alertEl.toggleClass('pe-none', !shouldQueue);
	};

	postQueue.onChangeCategory = async function (postContainer, postData) {
		if (!config.postQueue) {
			return;
		}
		postQueue.showAlert(postContainer, postData);
	};

	return postQueue;
});
