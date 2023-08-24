'use strict';

define('composer/post-queue', [], function () {
	const postQueue = {};

	postQueue.isExempt = async function (postData) {
		if (!config.postQueue || app.user.isAdmin || app.user.isGlobalMod || app.user.isMod) {
			return true;
		}
		return await socket.emit('plugins.composer.isExemptFromPostQueue', { postData: postData });
	};

	postQueue.onChangeCategory = async function (postContainer, postData) {
		if (!config.postQueue) {
			return;
		}
		const isExempt = await postQueue.isExempt(postData);
		postContainer.find('[component="composer/post-queue/alert"]')
			.toggleClass('hidden', isExempt);
	};

	return postQueue;
});
