'use strict';

define('composer/autoformat', ['hooks'], function (hooks) {
	const autoformat = {};

	const WRAPPERS = {
		'"': ['"', '"'],
		'(': ['(', ')'],
	};

	// Replace [start, end] of the textarea with `replacement`, place the
	// cursor after the inserted text, and notify the composer (live
	// preview). Uses setRangeText where available so the native undo
	// stack is preserved.
	autoformat.replaceRange = function (textarea, start, end, replacement) {
		if (typeof textarea.setRangeText === 'function') {
			textarea.setRangeText(replacement, start, end, 'end');
		} else {
			textarea.value = textarea.value.slice(0, start) + replacement + textarea.value.slice(end);
			textarea.setSelectionRange(start + replacement.length, start + replacement.length);
		}
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
	};

	autoformat.init = function (postContainer) {
		const textarea = postContainer.find('textarea')[0];
		textarea.addEventListener('keydown', (e) => {
			if (e.isComposing) {
				return;
			}

			// Extension point: other plugins get first crack at every keypress
			// (e.g. see plugin-markdown `continueList`). Handlers that want to
			// own the keypress must call event.preventDefault().
			hooks.fire('action:composer.keydown', { textarea, event: e, postContainer });
			if (e.defaultPrevented) {
				return;
			}

			// Built-in wrapping only applies to plain character presses
			if (e.ctrlKey || e.metaKey || e.altKey) {
				return;
			}

			const [open, close] = WRAPPERS[e.key] || [];
			if (!open) {
				return;
			}

			const { selectionStart: start, selectionEnd: end, value } = textarea;
			if (start === end) {
				return;
			}

			e.preventDefault();
			autoformat.replaceRange(textarea, start, end, open + value.slice(start, end) + close);
		});

		// Extension point for paste handling (e.g. markdown list continuation
		// for multi-line pastes). Handlers that want to own the paste must
		// call event.preventDefault() and insert the transformed text
		// themselves (see autoformat.replaceRange).
		textarea.addEventListener('paste', (e) => {
			hooks.fire('action:composer.paste', { textarea, event: e, postContainer });
		});
	};

	return autoformat;
});
