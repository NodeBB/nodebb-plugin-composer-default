"use strict";

/*global define*/

define('composer/controls', function() {
	var controls = {};

	/*************************************************/
	/* Rich Textarea Controls                        */
	/*************************************************/
	controls.insertIntoTextarea = function(textarea, value) {
		var $textarea = $(textarea);
		var currentVal = $textarea.val();

		$textarea.val(
			currentVal.slice(0, textarea.selectionStart) +
			value +
			currentVal.slice(textarea.selectionStart)
		);
	};

	controls.wrapSelectionInTextareaWith = function(textarea, leading, trailing){
		if (trailing === undefined) {
			trailing = leading;
		}

		var $textarea = $(textarea);
		var currentVal = $textarea.val();

		var matches = /^(\s*)([\s\S]*?)(\s*)$/.exec(currentVal.slice(textarea.selectionStart, textarea.selectionEnd));

		if (!matches[2]) {
			// selection is entirely whitespace
			matches = [null, '', currentVal.slice(textarea.selectionStart, textarea.selectionEnd), ''];
		}

		$textarea.val(
			currentVal.slice(0, textarea.selectionStart) +
			matches[1] +
			leading +
			matches[2] +
			trailing +
			matches[3] +
			currentVal.slice(textarea.selectionEnd)
		);
	};

	controls.updateTextareaSelection = function(textarea, start, end){
		textarea.setSelectionRange(start, end);
		$(textarea).focus();
	};


	return controls;
});
