<div class="d-flex justify-content-between gap-2 align-items-center formatting-bar">
	<ul class="list-unstyled mb-0 d-flex formatting-group gap-2 overflow-auto">
		{{{ each formatting }}}
			{{{ if ./spacer }}}
			<li class="small spacer"></li>
			{{{ else }}}
			{{{ if (./visibility.desktop && ((isTopicOrMain && ./visibility.main) || (!isTopicOrMain && ./visibility.reply))) }}}
			<li class="small">
				<a href="#" class="btn btn-sm btn-link text-reset position-relative" tabindex="-1" data-format="{./name}" title="{./title}">
					<i class="{./className}"></i>
					{{{ if ./badge }}}
					<span class="px-1 position-absolute top-0 start-100 translate-middle-x badge rounded text-bg-info"></span>
					{{{ end }}}
				</a>
			</li>
			{{{ end }}}
			{{{ end }}}
		{{{ end }}}

		{{{ if privileges.upload:post:image }}}
		<li class="img-upload-btn small">
			<a href="#" class="btn btn-sm btn-link text-reset" data-format="picture" tabindex="-1" title="[[modules:composer.upload-picture]]">
				<i class="fa fa-file-image-o"></i>
			</a>
		</li>
		{{{ end }}}
		{{{ if privileges.upload:post:file }}}
		<li class="file-upload-btn small">
			<a href="#" class="btn btn-sm btn-link text-reset" data-format="upload" tabindex="-1" title="[[modules:composer.upload-file]]">
				<i class="fa fa-file-o"></i>
			</a>
		</li>
		{{{ end }}}

		<form id="fileForm" method="post" enctype="multipart/form-data">
			<input type="file" id="files" name="files[]" multiple class="gte-ie9 hide"/>
		</form>
	</ul>
	<div class="d-flex align-items-center gap-1">
		<div class="draft-icon m-2 hidden-xs hidden-sm"></div>
		<button class="btn btn-sm btn-link py-2 text-body fw-semibold text-nowrap" data-action="preview">
			<i class="fa fa-eye"></i>
			<span class="d-none d-md-inline show-text">[[modules:composer.show_preview]]</span>
			<span class="d-none d-md-inline hide-text">[[modules:composer.hide_preview]]</span>
		</button>
		<button class="btn btn-sm btn-link py-2 text-body fw-semibold text-nowrap" data-action="help">
			<i class="fa fa-question"></i>
			<span class="d-none d-md-inline">[[modules:composer.help]]</span>
		</button>
	</div>
</div>

