<nav class="navbar navbar-expand formatting-bar">
	<ul class="formatting-group navbar-nav me-auto gap-2">
		<!-- BEGIN formatting -->
			<!-- IF formatting.spacer -->
			<li class="nav-item small spacer"></li>
			<!-- ELSE -->
			{{{ if (./visibility.desktop && ((isTopicOrMain && ./visibility.main) || (!isTopicOrMain && ./visibility.reply))) }}}
			<li class="nav-item small">
				<a href="#" class="nav-link" tabindex="-1" data-format="{formatting.name}" title="{formatting.title}">
					<i class="{formatting.className}"></i>
				</a>
			</li>
			{{{ end }}}
			<!-- ENDIF formatting.spacer -->
		<!-- END formatting -->

		<!-- IF privileges.upload:post:image -->
		<li class="img-upload-btn nav-item small">
			<a href="#" class="nav-link" data-format="picture" tabindex="-1" title="[[modules:composer.upload-picture]]">
				<i class="fa fa-file-image-o"></i>
			</a>
		</li>
		<!-- ENDIF privileges.upload:post:image -->
		<!-- IF privileges.upload:post:file -->
		<li class="file-upload-btn nav-item small">
			<a href="#" class="nav-link" data-format="upload" tabindex="-1" title="[[modules:composer.upload-file]]">
				<i class="fa fa-file-o"></i>
			</a>
		</li>
		<!-- ENDIF privileges.upload:post:file -->

		<form id="fileForm" method="post" enctype="multipart/form-data">
			<input type="file" id="files" name="files[]" multiple class="gte-ie9 hide"/>
		</form>
	</ul>
	<button class="btn btn-sm btn-link text-body fw-semibold" data-action="preview">
		<i class="fa fa-eye"></i>
		<span class="d-none d-md-inline">[[modules:composer.show_preview]]</span>
	</button>
	<button class="btn btn-sm btn-link text-body fw-semibold" data-action="help">
		<i class="fa fa-question"></i>
		<span class="d-none d-md-inline">[[modules:composer.help]]</span>
	</button>
</nav>
