'use strict';

define('composer', [
	'taskbar',
	'translator',
	'composer/uploads',
	'composer/formatting',
	'composer/drafts',
	'composer/tags',
	'composer/categoryList',
	'composer/preview',
	'composer/resize',
	'composer/autocomplete',
	'composer/scheduler',
	'composer/post-queue',
	'scrollStop',
	'topicThumbs',
	'api',
	'bootbox',
	'alerts',
	'hooks',
	'messages',
	'search',
	'screenfull',
], function (taskbar, translator, uploads, formatting, drafts, tags,
	categoryList, preview, resize, autocomplete, scheduler, postQueue, scrollStop,
	topicThumbs, api, bootbox, alerts, hooks, messagesModule, search, screenfull) {
	var composer = {
		active: undefined,
		posts: {},
		bsEnvironment: undefined,
		formatting: undefined,
	};

	$(window).off('resize', onWindowResize).on('resize', onWindowResize);
	onWindowResize();

	$(window).on('action:composer.topics.post', function (ev, data) {
		localStorage.removeItem('category:' + data.data.cid + ':bookmark');
		localStorage.removeItem('category:' + data.data.cid + ':bookmark:clicked');
	});

	$(window).on('popstate', function () {
		var env = utils.findBootstrapEnvironment();
		if (composer.active && (env === 'xs' || env === 'sm')) {
			if (!composer.posts[composer.active].modified) {
				composer.discard(composer.active);
				if (composer.discardConfirm && composer.discardConfirm.length) {
					composer.discardConfirm.modal('hide');
					delete composer.discardConfirm;
				}
				return;
			}

			translator.translate('[[modules:composer.discard]]', function (translated) {
				composer.discardConfirm = bootbox.confirm(translated, function (confirm) {
					if (confirm) {
						composer.discard(composer.active);
					} else {
						composer.posts[composer.active].modified = true;
					}
				});
				composer.posts[composer.active].modified = false;
			});
		}
	});

	function removeComposerHistory() {
		var env = composer.bsEnvironment;
		if (ajaxify.data.template.compose === true || env === 'xs' || env === 'sm') {
			history.back();
		}
	}

	function onWindowResize() {
		var env = utils.findBootstrapEnvironment();
		var isMobile = env === 'xs' || env === 'sm';

		if (preview.toggle) {
			if (preview.env !== env && isMobile) {
				preview.env = env;
				preview.toggle(false);
			}
			preview.env = env;
		}

		if (composer.active !== undefined) {
			resize.reposition($('.composer[data-uuid="' + composer.active + '"]'));

			if (!isMobile && window.location.pathname.startsWith(config.relative_path + '/compose')) {
				/*
				 *	If this conditional is met, we're no longer in mobile/tablet
				 *	resolution but we've somehow managed to have a mobile
				 *	composer load, so let's go back to the topic
				 */
				history.back();
			} else if (isMobile && !window.location.pathname.startsWith(config.relative_path + '/compose')) {
				/*
				 *	In this case, we're in mobile/tablet resolution but the composer
				 *	that loaded was a regular composer, so let's fix the address bar
				 */
				mobileHistoryAppend();
			}
		}
		composer.bsEnvironment = env;
	}

	function alreadyOpen(post) {
		// If a composer for the same cid/tid/pid is already open, return the uuid, else return bool false
		var type;
		var id;

		if (post.hasOwnProperty('cid')) {
			type = 'cid';
		} else if (post.hasOwnProperty('tid')) {
			type = 'tid';
		} else if (post.hasOwnProperty('pid')) {
			type = 'pid';
		}

		id = post[type];

		// Find a match
		for (var uuid in composer.posts) {
			if (composer.posts[uuid].hasOwnProperty(type) && id === composer.posts[uuid][type]) {
				return uuid;
			}
		}

		// No matches...
		return false;
	}

	function push(post) {
		if (!post) {
			return;
		}

		var uuid = utils.generateUUID();
		var existingUUID = alreadyOpen(post);

		if (existingUUID) {
			taskbar.updateActive(existingUUID);
			return composer.load(existingUUID);
		}

		var actionText = '[[topic:composer.new-topic]]';
		if (post.action === 'posts.reply') {
			actionText = '[[topic:composer.replying-to]]';
		} else if (post.action === 'posts.edit') {
			actionText = '[[topic:composer.editing-in]]';
		}

		translator.translate(actionText, function (translatedAction) {
			taskbar.push('composer', uuid, {
				title: translatedAction.replace('%1', '"' + post.title + '"'),
			});
		});

		composer.posts[uuid] = post;
		composer.load(uuid);
	}

	async function composerAlert(post_uuid, message) {
		$('.composer[data-uuid="' + post_uuid + '"]').find('.composer-submit').removeAttr('disabled');

		const { showAlert } = await hooks.fire('filter:composer.error', { post_uuid, message, showAlert: true });

		if (showAlert) {
			alerts.alert({
				type: 'danger',
				timeout: 10000,
				title: '',
				message: message,
				alert_id: 'post_error',
			});
		}
	}

	composer.findByTid = function (tid) {
		// Iterates through the initialised composers and returns the uuid of the matching composer
		for (var uuid in composer.posts) {
			if (composer.posts.hasOwnProperty(uuid) && composer.posts[uuid].hasOwnProperty('tid') && parseInt(composer.posts[uuid].tid, 10) === parseInt(tid, 10)) {
				return uuid;
			}
		}

		return null;
	};

	composer.addButton = function (iconClass, onClick, title) {
		formatting.addButton(iconClass, onClick, title);
	};

	composer.newTopic = async (data) => {
		let pushData = {
			save_id: data.save_id,
			action: 'topics.post',
			cid: data.cid,
			handle: data.handle,
			title: data.title || '',
			body: data.body || '',
			tags: data.tags || [],
			modified: !!((data.title && data.title.length) || (data.body && data.body.length)),
			isMain: true,
		};

		({ pushData } = await hooks.fire('filter:composer.topic.push', {
			data: data,
			pushData: pushData,
		}));

		push(pushData);
	};

	composer.addQuote = function (data) {
		// tid, toPid, selectedPid, title, username, text, uuid
		data.uuid = data.uuid || composer.active;

		var escapedTitle = (data.title || '')
			.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1')
			.replace(/\[/g, '&#91;')
			.replace(/\]/g, '&#93;')
			.replace(/%/g, '&#37;')
			.replace(/,/g, '&#44;');

		if (data.body) {
			data.body = '> ' + data.body.replace(/\n/g, '\n> ') + '\n\n';
		}
		var link = '[' + escapedTitle + '](' + config.relative_path + '/post/' + encodeURIComponent(data.selectedPid || data.toPid) + ')';
		if (data.uuid === undefined) {
			if (data.title && (data.selectedPid || data.toPid)) {
				composer.newReply({
					tid: data.tid,
					toPid: data.toPid,
					title: data.title,
					body: '[[modules:composer.user-said-in, ' + data.username + ', ' + link + ']]\n' + data.body,
				});
			} else {
				composer.newReply({
					tid: data.tid,
					toPid: data.toPid,
					title: data.title,
					body: '[[modules:composer.user-said, ' + data.username + ']]\n' + data.body,
				});
			}
			return;
		} else if (data.uuid !== composer.active) {
			// If the composer is not currently active, activate it
			composer.load(data.uuid);
		}

		var postContainer = $('.composer[data-uuid="' + data.uuid + '"]');
		var bodyEl = postContainer.find('textarea');
		var prevText = bodyEl.val();
		if (data.title && (data.selectedPid || data.toPid)) {
			translator.translate('[[modules:composer.user-said-in, ' + data.username + ', ' + link + ']]\n', config.defaultLang, onTranslated);
		} else {
			translator.translate('[[modules:composer.user-said, ' + data.username + ']]\n', config.defaultLang, onTranslated);
		}

		function onTranslated(translated) {
			composer.posts[data.uuid].body = (prevText.length ? prevText + '\n\n' : '') + translated + data.body;
			bodyEl.val(composer.posts[data.uuid].body);
			focusElements(postContainer);
			preview.render(postContainer);
		}
	};

	composer.newReply = function (data) {
		translator.translate(data.body, config.defaultLang, function (translated) {
			push({
				save_id: data.save_id,
				action: 'posts.reply',
				tid: data.tid,
				toPid: data.toPid,
				title: data.title,
				body: translated,
				modified: !!(translated && translated.length),
				isMain: false,
			});
		});
	};

	composer.editPost = function (data) {
		// pid, text
		socket.emit('plugins.composer.push', data.pid, function (err, postData) {
			if (err) {
				return alerts.error(err);
			}
			postData.save_id = data.save_id;
			postData.action = 'posts.edit';
			postData.pid = data.pid;
			postData.modified = false;
			if (data.body) {
				postData.body = data.body;
				postData.modified = true;
			}
			if (data.title) {
				postData.title = data.title;
				postData.modified = true;
			}
			push(postData);
		});
	};

	composer.load = function (post_uuid) {
		var postContainer = $('.composer[data-uuid="' + post_uuid + '"]');
		if (postContainer.length) {
			activate(post_uuid);
			resize.reposition(postContainer);
			focusElements(postContainer);
			onShow();
		} else if (composer.formatting) {
			createNewComposer(post_uuid);
		} else {
			socket.emit('plugins.composer.getFormattingOptions', function (err, options) {
				if (err) {
					return alerts.error(err);
				}
				composer.formatting = options;
				createNewComposer(post_uuid);
			});
		}
	};

	composer.enhance = function (postContainer, post_uuid, postData) {
		/*
			This method enhances a composer container with client-side sugar (preview, etc)
			Everything in here also applies to the /compose route
		*/

		if (!post_uuid && !postData) {
			post_uuid = utils.generateUUID();
			composer.posts[post_uuid] = ajaxify.data;
			postData = ajaxify.data;
			postContainer.attr('data-uuid', post_uuid);
		}

		categoryList.init(postContainer, composer.posts[post_uuid]);
		scheduler.init(postContainer, composer.posts);

		formatting.addHandler(postContainer);
		formatting.addComposerButtons();
		preview.handleToggler(postContainer);
		postQueue.showAlert(postContainer, postData);
		uploads.initialize(post_uuid);
		tags.init(postContainer, composer.posts[post_uuid]);
		autocomplete.init(postContainer, post_uuid);

		postContainer.on('change', 'input, textarea', function () {
			composer.posts[post_uuid].modified = true;
		});

		postContainer.on('click', '.composer-submit', function (e) {
			e.preventDefault();
			e.stopPropagation();	// Other click events bring composer back to active state which is undesired on submit

			$(this).attr('disabled', true);
			post(post_uuid);
		});

		require(['mousetrap'], function (mousetrap) {
			mousetrap(postContainer.get(0)).bind('mod+enter', function () {
				postContainer.find('.composer-submit').attr('disabled', true);
				post(post_uuid);
			});
		});

		postContainer.find('.composer-discard').on('click', function (e) {
			e.preventDefault();

			if (!composer.posts[post_uuid].modified) {
				composer.discard(post_uuid);
				return removeComposerHistory();
			}

			formatting.exitFullscreen();

			var btn = $(this).prop('disabled', true);
			translator.translate('[[modules:composer.discard]]', function (translated) {
				bootbox.confirm(translated, function (confirm) {
					if (confirm) {
						composer.discard(post_uuid);
						removeComposerHistory();
					}
					btn.prop('disabled', false);
				});
			});
		});

		postContainer.find('.composer-minimize, .minimize .trigger').on('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			composer.minimize(post_uuid);
		});

		const textareaEl = postContainer.find('textarea');
		textareaEl.on('input propertychange', utils.debounce(function () {
			preview.render(postContainer);
		}, 250));

		textareaEl.on('scroll', function () {
			preview.matchScroll(postContainer);
		});

		drafts.init(postContainer, postData);
		const draft = drafts.get(postData.save_id);

		preview.render(postContainer, function () {
			preview.matchScroll(postContainer);
		});

		handleHelp(postContainer);
		handleSearch(postContainer);
		focusElements(postContainer);
		if (postData.action === 'posts.edit') {
			composer.updateThumbCount(post_uuid, postContainer);
		}

		// Hide "zen mode" if fullscreen API is not enabled/available (ahem, iOS...)
		if (!screenfull.isEnabled) {
			$('[data-format="zen"]').parent().addClass('hidden');
		}

		hooks.fire('action:composer.enhanced', { postContainer, postData, draft });
	};

	async function getSelectedCategory(postData) {
		if (ajaxify.data.template.category && parseInt(postData.cid, 10) === parseInt(ajaxify.data.cid, 10)) {
			// no need to load data if we are already on the category page
			return ajaxify.data;
		} else if (parseInt(postData.cid, 10)) {
			return await api.get(`/api/category/${postData.cid}`, {});
		}
		return null;
	}

	async function createNewComposer(post_uuid) {
		var postData = composer.posts[post_uuid];

		var isTopic = postData ? postData.hasOwnProperty('cid') : false;
		var isMain = postData ? !!postData.isMain : false;
		var isEditing = postData ? !!postData.pid : false;
		var isGuestPost = postData ? parseInt(postData.uid, 10) === 0 : false;
		const isScheduled = postData.timestamp > Date.now();

		// see
		// https://github.com/NodeBB/NodeBB/issues/2994 and
		// https://github.com/NodeBB/NodeBB/issues/1951
		// remove when 1951 is resolved

		var title = postData.title.replace(/%/g, '&#37;').replace(/,/g, '&#44;');
		postData.category = await getSelectedCategory(postData);
		const privileges = postData.category ? postData.category.privileges : ajaxify.data.privileges;
		var data = {
			topicTitle: title,
			titleLength: title.length,
			body: translator.escape(utils.escapeHTML(postData.body)),
			mobile: composer.bsEnvironment === 'xs' || composer.bsEnvironment === 'sm',
			resizable: true,
			thumb: postData.thumb,
			isTopicOrMain: isTopic || isMain,
			maximumTitleLength: config.maximumTitleLength,
			maximumPostLength: config.maximumPostLength,
			minimumTagLength: config.minimumTagLength,
			maximumTagLength: config.maximumTagLength,
			'composer:showHelpTab': config['composer:showHelpTab'],
			isTopic: isTopic,
			isEditing: isEditing,
			canSchedule: !!(isMain && privileges &&
				((privileges['topics:schedule'] && !isEditing) || (isScheduled && privileges.view_scheduled))),
			showHandleInput: config.allowGuestHandles &&
				(app.user.uid === 0 || (isEditing && isGuestPost && app.user.isAdmin)),
			handle: postData ? postData.handle || '' : undefined,
			formatting: composer.formatting,
			tagWhitelist: postData.category ? postData.category.tagWhitelist : ajaxify.data.tagWhitelist,
			privileges: app.user.privileges,
			selectedCategory: postData.category,
			submitOptions: [
				// Add items using `filter:composer.create`, or just add them to the <ul> in DOM
				// {
				// 	action: 'foobar',
				// 	text: 'Text Label',
				// }
			],
		};

		if (data.mobile) {
			mobileHistoryAppend();

			app.toggleNavbar(false);
		}

		postData.mobile = composer.bsEnvironment === 'xs' || composer.bsEnvironment === 'sm';

		({ postData, createData: data } = await hooks.fire('filter:composer.create', {
			postData: postData,
			createData: data,
		}));

		app.parseAndTranslate('composer', data, function (composerTemplate) {
			if ($('.composer.composer[data-uuid="' + post_uuid + '"]').length) {
				return;
			}
			composerTemplate = $(composerTemplate);

			composerTemplate.find('.title').each(function () {
				$(this).text(translator.unescape($(this).text()));
			});

			composerTemplate.attr('data-uuid', post_uuid);

			$(document.body).append(composerTemplate);

			var postContainer = $(composerTemplate[0]);

			resize.reposition(postContainer);
			composer.enhance(postContainer, post_uuid, postData);
			/*
				Everything after this line is applied to the resizable composer only
				Want something done to both resizable composer and the one in /compose?
				Put it in composer.enhance().

				Eventually, stuff after this line should be moved into composer.enhance().
			*/

			activate(post_uuid);

			postContainer.on('click', function () {
				if (!taskbar.isActive(post_uuid)) {
					taskbar.updateActive(post_uuid);
				}
			});

			resize.handleResize(postContainer);

			if (composer.bsEnvironment === 'xs' || composer.bsEnvironment === 'sm') {
				var submitBtns = postContainer.find('.composer-submit');
				var mobileSubmitBtn = postContainer.find('.mobile-navbar .composer-submit');
				var textareaEl = postContainer.find('.write');
				var idx = textareaEl.attr('tabindex');

				submitBtns.removeAttr('tabindex');
				mobileSubmitBtn.attr('tabindex', parseInt(idx, 10) + 1);
			}

			$(window).trigger('action:composer.loaded', {
				postContainer: postContainer,
				post_uuid: post_uuid,
				composerData: composer.posts[post_uuid],
				formatting: composer.formatting,
			});

			scrollStop.apply(postContainer.find('.write'));
			focusElements(postContainer);
			onShow();
		});
	}

	function mobileHistoryAppend() {
		var path = 'compose?p=' + window.location.pathname;
		var returnPath = window.location.pathname.slice(1) + window.location.search;

		// Remove relative path from returnPath
		if (returnPath.startsWith(config.relative_path.slice(1))) {
			returnPath = returnPath.slice(config.relative_path.length);
		}

		// Add in return path to be caught by ajaxify when post is completed, or if back is pressed
		window.history.replaceState({
			url: null,
			returnPath: returnPath,
		}, returnPath, config.relative_path + '/' + returnPath);

		// Update address bar in case f5 is pressed
		window.history.pushState({
			url: path,
		}, path, `${config.relative_path}/${returnPath}`);
	}

	function handleHelp(postContainer) {
		const helpBtn = postContainer.find('[data-action="help"]');
		helpBtn.on('click', async function () {
			const html = await socket.emit('plugins.composer.renderHelp');
			if (html && html.length > 0) {
				bootbox.dialog({
					size: 'large',
					message: html,
					onEscape: true,
					backdrop: true,
					onHidden: function () {
						helpBtn.focus();
					},
				});
			}
		});
	}

	function handleSearch(postContainer) {
		var uuid = postContainer.attr('data-uuid');
		var isEditing = composer.posts[uuid] && composer.posts[uuid].action === 'posts.edit';
		var env = utils.findBootstrapEnvironment();
		var isMobile = env === 'xs' || env === 'sm';
		if (isEditing || isMobile) {
			return;
		}

		search.enableQuickSearch({
			searchElements: {
				inputEl: postContainer.find('input.title'),
				resultEl: postContainer.find('.quick-search-container'),
			},
			searchOptions: {
				composer: 1,
			},
			hideOnNoMatches: true,
			hideDuringSearch: true,
		});
	}

	function activate(post_uuid) {
		if (composer.active && composer.active !== post_uuid) {
			composer.minimize(composer.active);
		}

		composer.active = post_uuid;
		const postContainer = $('.composer[data-uuid="' + post_uuid + '"]');
		postContainer.css('visibility', 'visible');
		$(window).trigger('action:composer.activate', {
			post_uuid: post_uuid,
			postContainer: postContainer,
		});
	}

	function focusElements(postContainer) {
		setTimeout(function () {
			var title = postContainer.find('input.title');

			if (title.length) {
				title.focus();
			} else {
				postContainer.find('textarea').focus().putCursorAtEnd();
			}
		}, 20);
	}

	async function post(post_uuid) {
		var postData = composer.posts[post_uuid];
		var postContainer = $('.composer[data-uuid="' + post_uuid + '"]');
		var handleEl = postContainer.find('.handle');
		var titleEl = postContainer.find('.title');
		var bodyEl = postContainer.find('textarea');
		var thumbEl = postContainer.find('input#topic-thumb-url');
		var onComposeRoute = postData.hasOwnProperty('template') && postData.template.compose === true;
		const submitBtn = postContainer.find('.composer-submit');

		titleEl.val(titleEl.val().trim());
		bodyEl.val(utils.rtrim(bodyEl.val()));
		if (thumbEl.length) {
			thumbEl.val(thumbEl.val().trim());
		}

		var action = postData.action;

		var checkTitle = (postData.hasOwnProperty('cid') || parseInt(postData.pid, 10)) && postContainer.find('input.title').length;
		var isCategorySelected = !checkTitle || (checkTitle && parseInt(postData.cid, 10));

		// Specifically for checking title/body length via plugins
		var payload = {
			post_uuid: post_uuid,
			postData: postData,
			postContainer: postContainer,
			titleEl: titleEl,
			titleLen: titleEl.val().length,
			bodyEl: bodyEl,
			bodyLen: bodyEl.val().length,
		};

		await hooks.fire('filter:composer.check', payload);
		$(window).trigger('action:composer.check', payload);

		if (payload.error) {
			return composerAlert(post_uuid, payload.error);
		}

		if (uploads.inProgress[post_uuid] && uploads.inProgress[post_uuid].length) {
			return composerAlert(post_uuid, '[[error:still-uploading]]');
		} else if (checkTitle && payload.titleLen < parseInt(config.minimumTitleLength, 10)) {
			return composerAlert(post_uuid, '[[error:title-too-short, ' + config.minimumTitleLength + ']]');
		} else if (checkTitle && payload.titleLen > parseInt(config.maximumTitleLength, 10)) {
			return composerAlert(post_uuid, '[[error:title-too-long, ' + config.maximumTitleLength + ']]');
		} else if (action === 'topics.post' && !isCategorySelected) {
			return composerAlert(post_uuid, '[[error:category-not-selected]]');
		} else if (payload.bodyLen < parseInt(config.minimumPostLength, 10)) {
			return composerAlert(post_uuid, '[[error:content-too-short, ' + config.minimumPostLength + ']]');
		} else if (payload.bodyLen > parseInt(config.maximumPostLength, 10)) {
			return composerAlert(post_uuid, '[[error:content-too-long, ' + config.maximumPostLength + ']]');
		} else if (checkTitle && !tags.isEnoughTags(post_uuid)) {
			return composerAlert(post_uuid, '[[error:not-enough-tags, ' + tags.minTagCount() + ']]');
		} else if (scheduler.isActive() && scheduler.getTimestamp() <= Date.now()) {
			return composerAlert(post_uuid, '[[error:scheduling-to-past]]');
		}

		let composerData = {
			uuid: post_uuid,
		};
		let method = 'post';
		let route = '';

		if (action === 'topics.post') {
			route = '/topics';
			composerData = {
				...composerData,
				handle: handleEl ? handleEl.val() : undefined,
				title: titleEl.val(),
				content: bodyEl.val(),
				thumb: thumbEl.val() || '',
				cid: categoryList.getSelectedCid(),
				tags: tags.getTags(post_uuid),
				timestamp: scheduler.getTimestamp(),
			};
		} else if (action === 'posts.reply') {
			route = `/topics/${postData.tid}`;
			composerData = {
				...composerData,
				tid: postData.tid,
				handle: handleEl ? handleEl.val() : undefined,
				content: bodyEl.val(),
				toPid: postData.toPid,
			};
		} else if (action === 'posts.edit') {
			method = 'put';
			route = `/posts/${postData.pid}`;
			composerData = {
				...composerData,
				pid: postData.pid,
				handle: handleEl ? handleEl.val() : undefined,
				content: bodyEl.val(),
				title: titleEl.val(),
				thumb: thumbEl.val() || '',
				tags: tags.getTags(post_uuid),
				timestamp: scheduler.getTimestamp(),
			};
		}
		var submitHookData = {
			composerEl: postContainer,
			action: action,
			composerData: composerData,
			postData: postData,
			redirect: true,
		};

		await hooks.fire('filter:composer.submit', submitHookData);
		hooks.fire('action:composer.submit', Object.freeze(submitHookData));

		// Minimize composer (and set textarea as readonly) while submitting
		var taskbarIconEl = $('#taskbar .composer[data-uuid="' + post_uuid + '"] i');
		var textareaEl = postContainer.find('.write');
		taskbarIconEl.removeClass('fa-plus').addClass('fa-circle-o-notch fa-spin');
		composer.minimize(post_uuid);
		textareaEl.prop('readonly', true);

		api[method](route, composerData)
			.then((data) => {
				submitBtn.removeAttr('disabled');
				postData.submitted = true;

				composer.discard(post_uuid);
				drafts.removeDraft(postData.save_id);

				if (data.queued) {
					alerts.alert({
						type: 'success',
						title: '[[global:alert.success]]',
						message: data.message,
						timeout: 10000,
						clickfn: function () {
							ajaxify.go(`/post-queue/${data.id}`);
						},
					});
				} else if (action === 'topics.post') {
					if (submitHookData.redirect) {
						ajaxify.go('topic/' + data.slug, undefined, (onComposeRoute || composer.bsEnvironment === 'xs' || composer.bsEnvironment === 'sm'));
					}
				} else if (action === 'posts.reply') {
					if (onComposeRoute || composer.bsEnvironment === 'xs' || composer.bsEnvironment === 'sm') {
						window.history.back();
					} else if (submitHookData.redirect &&
						((ajaxify.data.template.name !== 'topic') ||
						(ajaxify.data.template.topic && parseInt(postData.tid, 10) !== parseInt(ajaxify.data.tid, 10)))
					) {
						ajaxify.go('post/' + data.pid);
					}
				} else {
					removeComposerHistory();
				}

				hooks.fire('action:composer.' + action, { composerData: composerData, data: data });
			})
			.catch((err) => {
				// Restore composer on error
				composer.load(post_uuid);
				textareaEl.prop('readonly', false);
				if (err.message === '[[error:email-not-confirmed]]') {
					return messagesModule.showEmailConfirmWarning(err.message);
				}
				composerAlert(post_uuid, err.message);
			});
	}

	function onShow() {
		$('html').addClass('composing');
	}

	function onHide() {
		$('#content').css({ paddingBottom: 0 });
		$('html').removeClass('composing');
		app.toggleNavbar(true);
		formatting.exitFullscreen();
	}

	composer.discard = function (post_uuid) {
		if (composer.posts[post_uuid]) {
			var postData = composer.posts[post_uuid];
			var postContainer = $('.composer[data-uuid="' + post_uuid + '"]');
			postContainer.remove();
			drafts.removeDraft(postData.save_id);
			topicThumbs.deleteAll(post_uuid);

			taskbar.discard('composer', post_uuid);
			$('[data-action="post"]').removeAttr('disabled');

			hooks.fire('action:composer.discard', {
				post_uuid: post_uuid,
				postData: postData,
			});
			delete composer.posts[post_uuid];
			composer.active = undefined;
		}
		scheduler.reset();
		onHide();
	};

	// Alias to .discard();
	composer.close = composer.discard;

	composer.minimize = function (post_uuid) {
		var postContainer = $('.composer[data-uuid="' + post_uuid + '"]');
		postContainer.css('visibility', 'hidden');
		composer.active = undefined;
		taskbar.minimize('composer', post_uuid);
		$(window).trigger('action:composer.minimize', {
			post_uuid: post_uuid,
		});

		onHide();
	};

	composer.minimizeActive = function () {
		if (composer.active) {
			composer.miminize(composer.active);
		}
	};

	composer.updateThumbCount = function (uuid, postContainer) {
		const composerObj = composer.posts[uuid];
		if (composerObj.action === 'topics.post' || (composerObj.action === 'posts.edit' && composerObj.isMain)) {
			const calls = [
				topicThumbs.get(uuid),
			];
			if (composerObj.pid) {
				calls.push(topicThumbs.getByPid(composerObj.pid));
			}
			Promise.all(calls).then((thumbs) => {
				const thumbCount = thumbs.flat().length;
				const formatEl = postContainer.find('[data-format="thumbs"]');
				formatEl.find('.badge')
					.text(thumbCount)
					.toggleClass('hidden', !thumbCount);
			});
		}
	};

	return composer;
});
