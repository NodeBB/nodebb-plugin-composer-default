'use strict';

define('composer/controls', ['composer/preview'], function (preview) {
	const controls = {};

	// Replaces the text between `start` and `end` with `text`. Prefers the
	// browser's native insertion command so that the change is recorded in the
	// textarea's undo history (Ctrl/Cmd+Z), and falls back to a direct value
	// update when that is unavailable.
	function replaceRange(textarea, start, end, text) {
		textarea.focus();
		textarea.setSelectionRange(start, end);

		if (text && typeof document.execCommand === 'function') {
			let inserted;
			try {
				inserted = document.execCommand('insertText', false, text);
			} catch (e) {
				inserted = false;
			}
			if (inserted && textarea.value.slice(start, start + text.length) === text) {
				return;
			}
			// the command may have been ignored; make sure the selection was not changed
			textarea.setSelectionRange(start, end);
		}

		if (typeof textarea.setRangeText === 'function') {
			textarea.setRangeText(text, start, end, 'end');
		} else {
			const currentVal = textarea.value;
			textarea.value = currentVal.slice(0, start) + text + currentVal.slice(end);
		}
	}

	/** ********************************************** */
	/* Rich Textarea Controls                        */
	/** ********************************************** */
	controls.insertIntoTextarea = function (textarea, value) {
		const payload = {
			context: this,
			textarea: textarea,
			value: value,
			preventDefault: false,
		};
		$(window).trigger('action:composer.insertIntoTextarea', payload);

		if (payload.preventDefault) {
			return;
		}

		const postContainer = $(payload.textarea).parents('[component="composer"]');

		replaceRange(
			payload.textarea,
			payload.textarea.selectionStart,
			payload.textarea.selectionStart,
			payload.value
		);

		preview.render(postContainer);
	};

	controls.replaceSelectionInTextareaWith = function (textarea, value) {
		const payload = {
			context: this,
			textarea: textarea,
			value: value,
			preventDefault: false,
		};
		$(window).trigger('action:composer.replaceSelectionInTextareaWith', payload);

		if (payload.preventDefault) {
			return;
		}

		const postContainer = $(payload.textarea).parents('[component="composer"]');

		replaceRange(
			payload.textarea,
			payload.textarea.selectionStart,
			payload.textarea.selectionEnd,
			payload.value
		);

		preview.render(postContainer);
	};

	controls.wrapSelectionInTextareaWith = function (textarea, leading, trailing) {
		const payload = {
			context: this,
			textarea: textarea,
			leading: leading,
			trailing: trailing,
			preventDefault: false,
		};
		$(window).trigger('action:composer.wrapSelectionInTextareaWith', payload);

		if (payload.preventDefault) {
			return;
		}

		if (trailing === undefined) {
			trailing = leading;
		}

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selection = textarea.value.slice(start, end);

		let matches = /^(\s*)([\s\S]*?)(\s*)$/.exec(selection);

		if (!matches[2]) {
			// selection is entirely whitespace
			matches = [null, '', selection, ''];
		}

		replaceRange(textarea, start, end, matches[1] + leading + matches[2] + trailing + matches[3]);

		return [matches[1].length, matches[3].length];
	};

	controls.updateTextareaSelection = function (textarea, start, end) {
		const payload = {
			context: this,
			textarea: textarea,
			start: start,
			end: end,
			preventDefault: false,
		};
		$(window).trigger('action:composer.updateTextareaSelection', payload);

		if (payload.preventDefault) {
			return;
		}

		textarea.setSelectionRange(payload.start, payload.end);
		$(payload.textarea).focus();
	};

	controls.getBlockData = function (textareaEl, query, selectionStart) {
		// Determines whether the cursor is sitting inside a block-type element (bold, italic, etc.)
		let value = textareaEl.value;
		query = query.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
		const regex = new RegExp(query, 'g');
		let match;
		const matchIndices = [];

		// Isolate the line the cursor is on
		value = value.split('\n').reduce(function (memo, line) {
			if (memo !== null) {
				return memo;
			}

			memo = selectionStart <= line.length ? line : null;

			if (memo === null) {
				selectionStart -= (line.length + 1);
			}

			return memo;
		}, null);

		// Find query characters and determine return payload
		while ((match = regex.exec(value)) !== null) {
			matchIndices.push(match.index);
		}

		const payload = {
			in: !!(matchIndices.reduce(function (memo, cur) {
				if (selectionStart >= cur + 2) {
					memo += 1;
				}

				return memo;
			}, 0) % 2),
			atEnd: matchIndices.reduce(function (memo, cur) {
				if (memo) {
					return memo;
				}

				return selectionStart === cur;
			}, false),
		};

		payload.atEnd = payload.in ? payload.atEnd : false;
		return payload;
	};

	return controls;
});
