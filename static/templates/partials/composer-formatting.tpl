<div class="d-flex justify-content-between gap-2 align-items-center formatting-bar">
	<ul class="list-unstyled mb-0 d-flex formatting-group gap-2 overflow-auto">
		<!-- BEGIN formatting -->
			<!-- IF formatting.spacer -->
			<li class="small spacer"></li>
			<!-- ELSE -->
			{{{ if (./visibility.desktop && ((isTopicOrMain && ./visibility.main) || (!isTopicOrMain && ./visibility.reply))) }}}
			<li class="small">
				<a href="#" class="btn btn-sm btn-link text-reset" tabindex="-1" data-format="{formatting.name}" title="{formatting.title}">
					<i class="{formatting.className}"></i>
				</a>
			</li>
			{{{ end }}}
			<!-- ENDIF formatting.spacer -->
		<!-- END formatting -->

		<!-- IF privileges.upload:post:image -->
		<li class="img-upload-btn small">
			<a href="#" class="btn btn-sm btn-link text-reset" data-format="picture" tabindex="-1" title="[[modules:composer.upload-picture]]">
				<i class="fa fa-file-image-o"></i>
			</a>
		</li>
		<!-- ENDIF privileges.upload:post:image -->
		<!-- IF privileges.upload:post:file -->
		<li class="file-upload-btn small">
			<a href="#" class="btn btn-sm btn-link text-reset" data-format="upload" tabindex="-1" title="[[modules:composer.upload-file]]">
				<i class="fa fa-file-o"></i>
			</a>
		</li>
		<!-- ENDIF privileges.upload:post:file -->

		<form id="fileForm" method="post" enctype="multipart/form-data">
			<input type="file" id="files" name="files[]" multiple class="gte-ie9 hide"/>
		</form>
	</ul>
	<div class="d-flex align-items-center gap-1">
		<div class="draft-icon m-2 hidden-xs hidden-sm"></div>
		<button class="btn btn-sm btn-link py-2 text-body fw-semibold" data-action="preview">
			<i class="fa fa-eye"></i>
			<span class="d-none d-md-inline show-text">[[modules:composer.show_preview]]</span>
			<span class="d-none d-md-inline hide-text">[[modules:composer.hide_preview]]</span>
		</button>
		<button class="btn btn-sm btn-link py-2 text-body fw-semibold" data-action="help">
			<i class="fa fa-question"></i>
			<span class="d-none d-md-inline">[[modules:composer.help]]</span>
		</button>
	</div>
</div>

