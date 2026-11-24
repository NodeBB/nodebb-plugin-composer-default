'use strict';

define('composer/autoformat', ['hooks'], function (hooks) {
	const autoformat = {};

	const WRAPPERS = {
		'"': ['"', '"'],
		'(': ['(', ')'],
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
			const replacement = open + value.slice(start, end) + close;

			// setRangeText preserves the native undo stack; 'end' places the
			// cursor just after the closing character
			if (typeof textarea.setRangeText === 'function') {
				textarea.setRangeText(replacement, start, end, 'end');
			} else {
				textarea.value = value.slice(0, start) + replacement + value.slice(end);
				textarea.setSelectionRange(start + replacement.length, start + replacement.length);
			}
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
		});
	};

	return autoformat;
});
