<div class="category-tag-row">
	<div class="btn-toolbar formatting-bar">
		<ul class="formatting-group">
			<!-- BEGIN formatting -->
				<!-- IF formatting.spacer -->
				<li class="spacer"></li>
				<!-- ELSE -->
				{{{ if (./visibility.desktop && ((isTopicOrMain && ./visibility.main) || (!isTopicOrMain && ./visibility.reply))) }}}
				<li tabindex="-1" data-format="{formatting.name}" title="{formatting.title}"><i class="{formatting.className}"></i></li>
				{{{ end }}}
				<!-- ENDIF formatting.spacer -->
			<!-- END formatting -->

			<!-- IF privileges.upload:post:image -->
			<li class="img-upload-btn" data-format="picture" tabindex="-1" title="[[modules:composer.upload-picture]]">
				<i class="fa fa-file-image-o"></i>
			</li>
			<!-- ENDIF privileges.upload:post:image -->
			<!-- IF privileges.upload:post:file -->
			<li class="file-upload-btn" data-format="upload" tabindex="-1" title="[[modules:composer.upload-file]]">
				<i class="fa fa-file-o"></i>
			</li>
			<!-- ENDIF privileges.upload:post:file -->

			<form id="fileForm" method="post" enctype="multipart/form-data">
				<input type="file" id="files" name="files[]" multiple class="gte-ie9 hide"/>
			</form>
		</ul>
	</div>
</div>
