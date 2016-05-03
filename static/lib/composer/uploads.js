'use strict';

/* globals define, utils, config, app */

define('composer/uploads', [
	'composer/preview',
	'csrf',
	'translator'
], function(preview, csrf, translator) {
	var uploads = {
		inProgress: {}
	};

	var uploadingText = 'uploading 0%';

	uploads.initialize = function(post_uuid) {

		initializeDragAndDrop(post_uuid);
		initializePaste(post_uuid);

		addChangeHandlers(post_uuid);
		addTopicThumbHandlers(post_uuid);
		translator.translate('[[modules:composer.uploading, ' + 0 + '%]]', function(translated) {
			uploadingText = translated;
		});
	};

	function addChangeHandlers(post_uuid) {
		var postContainer = $('#cmp-uuid-' + post_uuid);

		postContainer.find('#files').on('change', function(e) {
			var files = (e.target || {}).files || ($(this).val() ? [{name: $(this).val(), type: utils.fileMimeType($(this).val())}] : null);
			if (files) {
				uploadContentFiles({files: files, post_uuid: post_uuid, route: '/api/post/upload'});
			}
		});

		postContainer.find('#topic-thumb-file').on('change', function(e) {
			var files = (e.target || {}).files || ($(this).val() ? [{name: $(this).val(), type: utils.fileMimeType($(this).val())}] : null),
				fd;

			if (files) {
				if (window.FormData) {
					fd = new FormData();
					for (var i = 0; i < files.length; ++i) {
						fd.append('files[]', files[i], files[i].name);
					}
				}
				uploadTopicThumb({files: files, post_uuid: post_uuid, route: '/api/topic/thumb/upload', formData: fd});
			}
		});
	}

	function addTopicThumbHandlers(post_uuid) {
		var postContainer = $('#cmp-uuid-' + post_uuid);

		postContainer.on('click', '.topic-thumb-clear-btn', function(e) {
			postContainer.find('input#topic-thumb-url').val('').trigger('change');
			resetInputFile(postContainer.find('input#topic-thumb-file'));
			$(this).addClass('hide');
			e.preventDefault();
		});

		postContainer.on('paste change keypress', 'input#topic-thumb-url', function() {
			var urlEl = $(this);
			setTimeout(function(){
				var url = urlEl.val();
				if (url) {
					postContainer.find('.topic-thumb-clear-btn').removeClass('hide');
				} else {
					resetInputFile(postContainer.find('input#topic-thumb-file'));
					postContainer.find('.topic-thumb-clear-btn').addClass('hide');
				}
				postContainer.find('img.topic-thumb-preview').attr('src', url);
			}, 100);
		});
	}

	uploads.toggleThumbEls = function(postContainer, url) {
		var thumbToggleBtnEl = postContainer.find('.topic-thumb-toggle-btn');

		postContainer.find('input#topic-thumb-url').val(url);
		postContainer.find('img.topic-thumb-preview').attr('src', url);
		if (url) {
			postContainer.find('.topic-thumb-clear-btn').removeClass('hide');
		}
		thumbToggleBtnEl.removeClass('hide');
		thumbToggleBtnEl.off('click').on('click', function() {
			var container = postContainer.find('.topic-thumb-container');
			container.toggleClass('hide', !container.hasClass('hide'));
		});
	};

	function resetInputFile($el) {
		$el.wrap('<form />').closest('form').get(0).reset();
		$el.unwrap();
	}

	function initializeDragAndDrop(post_uuid) {

		function onDragEnter() {
			if (draggingDocument) {
				return;
			}
			drop.css('top', postContainer.find('.write-preview-container').position().top + 'px');
			drop.css('height', textarea.height());
			drop.css('line-height', textarea.height() + 'px');
			drop.show();

			drop.on('dragleave', function() {
				drop.hide();
				drop.off('dragleave');
			});
		}

		function onDragDrop(e) {
			e.preventDefault();
			var files = e.files || (e.dataTransfer || {}).files || (e.target.value ? [e.target.value] : []),
				fd;

			if (files.length) {
				if (window.FormData) {
					fd = new FormData();
					for (var i = 0; i < files.length; ++i) {
						fd.append('files[]', files[i], files[i].name);
					}
				}

				uploadContentFiles({
					files: files,
					post_uuid: post_uuid,
					route: '/api/post/upload',
					formData: fd
				});
			}

			drop.hide();
			return false;
		}

		function cancel(e) {
			e.preventDefault();
			return false;
		}

		if($.event.props.indexOf('dataTransfer') === -1) {
			$.event.props.push('dataTransfer');
		}

		var draggingDocument = false;

		var postContainer = $('#cmp-uuid-' + post_uuid),
			drop = postContainer.find('.imagedrop'),
			textarea = postContainer.find('textarea');

		$(document).off('dragstart').on('dragstart', function() {
			draggingDocument = true;
		}).off('dragend').on('dragend', function() {
			draggingDocument = false;
		});

		textarea.on('dragenter', onDragEnter);

		drop.on('dragover', cancel);
		drop.on('dragenter', cancel);
		drop.on('drop', onDragDrop);
	}

	function initializePaste(post_uuid) {
		$(window).off('paste').on('paste', function(event) {

			var items = (event.clipboardData || event.originalEvent.clipboardData || {}).items;

			[].some.call(items, function(item) {
				var blob = item.getAsFile();

				if (!blob) {
					return false;
				}

				blob.name = 'upload-' + utils.generateUUID();

				var fd = null;
				if (window.FormData) {
					fd = new FormData();
					fd.append('files[]', blob, blob.name);
				}

				uploadContentFiles({
					files: [blob],
					post_uuid: post_uuid,
					route: '/api/post/upload',
					formData: fd
				});

				return true;
			});
		});
	}

	function escapeRegExp(text) {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	}

	function maybeParse(response) {
		if (typeof response === 'string')  {
			try {
				return $.parseJSON(response);
			} catch (e) {
				return {status: 500, message: 'Something went wrong while parsing server response'};
			}
		}
		return response;
	}

	function insertText(str, index, insert) {
		return str.slice(0, index) + insert + str.slice(index);
	}

	function uploadContentFiles(params) {
		var files = params.files,
			post_uuid = params.post_uuid,
			postContainer = $('#cmp-uuid-' + post_uuid),
			textarea = postContainer.find('textarea'),
			text = textarea.val(),
			uploadForm = postContainer.find('#fileForm');

		uploadForm.attr('action', config.relative_path + params.route);

		var filenameMapping = [];

		for (var i = 0; i < files.length; ++i) {
			filenameMapping.push(i + '_' + Date.now() + '_' + files[i].name);
			var isImage = files[i].type.match(/image./);

			if (files[i].size > parseInt(config.maximumFileSize, 10) * 1024) {
				uploadForm[0].reset();
				return app.alertError('[[error:file-too-big, ' + config.maximumFileSize + ']]');
			}

			text = insertText(text, textarea.getCursorPosition(), (isImage ? '!' : '') + '[' + filenameMapping[i] + '](' + uploadingText + ') ');
		}

		textarea.val(text);

		uploadForm.off('submit').submit(function() {
			function updateTextArea(filename, text) {
				var current = textarea.val();
				var re = new RegExp(escapeRegExp(filename) + "]\\([^)]+\\)", 'g');
				textarea.val(current.replace(re, filename + '](' + text + ')'));
			}

			uploads.inProgress[post_uuid] = uploads.inProgress[post_uuid] || [];
			uploads.inProgress[post_uuid].push(1);

			$(this).ajaxSubmit({
				headers: {
					'x-csrf-token': csrf.get()
				},
				resetForm: true,
				clearForm: true,
				formData: params.formData,

				error: onUploadError,

				uploadProgress: function(event, position, total, percent) {
					translator.translate('[[modules:composer.uploading, ' + percent + '%]]', function(translated) {
						for (var i=0; i < files.length; ++i) {
							updateTextArea(filenameMapping[i], translated);
						}
					});
				},

				success: function(uploads) {
					uploads = maybeParse(uploads);

					if(uploads && uploads.length) {
						for(var i=0; i<uploads.length; ++i) {
							updateTextArea(filenameMapping[i], uploads[i].url);
						}
					}
					preview.render(postContainer);
					textarea.focus();
				},

				complete: function() {
					uploadForm[0].reset();
					uploads.inProgress[post_uuid].pop();
				}
			});

			return false;
		});

		uploadForm.submit();
	}

	function uploadTopicThumb(params) {
		var post_uuid = params.post_uuid,
			postContainer = $('#cmp-uuid-' + post_uuid),
			spinner = postContainer.find('.topic-thumb-spinner'),
			thumbForm = postContainer.find('#thumbForm');

		thumbForm.attr('action', config.relative_path + params.route);

		thumbForm.off('submit').submit(function() {
			spinner.removeClass('hide');

			uploads.inProgress[post_uuid] = uploads.inProgress[post_uuid] || [];
			uploads.inProgress[post_uuid].push(1);

			$(this).ajaxSubmit({
				headers: {
					'x-csrf-token': csrf.get()
				},
				formData: params.formData,
				error: onUploadError,
				success: function(uploads) {
					uploads = maybeParse(uploads);

					postContainer.find('#topic-thumb-url').val((uploads[0] || {}).url || '').trigger('change');
				},
				complete: function() {
					uploads.inProgress[post_uuid].pop();
					spinner.addClass('hide');
				}
			});
			return false;
		});
		thumbForm.submit();
	}

	function onUploadError(xhr) {
		xhr = maybeParse(xhr);
		app.alertError(xhr.responseText);
	}

	return uploads;
});

