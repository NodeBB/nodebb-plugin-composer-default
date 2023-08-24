<div class="write-preview-container d-flex gap-2 flex-grow-1 overflow-auto">
	<div class="write-container d-flex d-md-flex w-50 position-relative">
		<div component="composer/post-queue/alert" class="{{{ if exemptFromPostQueue }}}hidden{{{ end }}} m-2 alert alert-info position-absolute top-0 start-0 alert-dismissible">[[modules:composer.post-queue-alert]]<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>
		<div class="float-end draft-icon hidden-md hidden-lg"></div>
		<textarea class="write shadow-none rounded-1 w-100 form-control" tabindex="4" placeholder="[[modules:composer.textarea.placeholder]]">{body}</textarea>
	</div>
	<div class="preview-container d-none d-md-flex w-50">
		<div class="preview card card-body bg-light rounded-1 overflow-auto"></div>
	</div>
</div>