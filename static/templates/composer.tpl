<div component="composer" class="composer<!-- IF resizable --> resizable<!-- ENDIF resizable --><!-- IF !isTopicOrMain --> reply<!-- ENDIF !isTopicOrMain -->">

	<div class="composer-container">
		<nav class="navbar fixed-top mobile-navbar hidden-md hidden-lg text-bg-primary">
			<div class="btn-group">
				<button class="btn btn-sm btn-primary composer-discard" data-action="discard" tabindex="-1"><i class="fa fa-times"></i></button>
				<button class="btn btn-sm btn-primary composer-minimize" data-action="minimize" tabindex="-1"><i class="fa fa-minus"></i></button>
			</div>
			<!-- IF isTopic -->
			<div class="category-name-container">
				<span class="category-name"></span> <i class="fa fa-sort"></i>
			</div>
			<!-- ENDIF isTopic -->
			<!-- IF !isTopicOrMain -->
			<h4 class="title">[[topic:composer.replying_to, "{title}"]]</h4>
			<!-- ENDIF !isTopicOrMain -->
			<div class="display-scheduler float-end{{{ if !canSchedule }}} hidden{{{ end }}}">
				<i class="fa fa-clock-o"></i>
			</div>
			<div class="btn-group">
				<button class="btn btn-sm btn-primary composer-submit" data-action="post" tabindex="-1"><i class="fa fa-chevron-right"></i></button>
			</div>
		</nav>
		<div class="title-container">
			{{{ if isTopic }}}
			<div class="category-list-container hidden-sm hidden-xs">
				<!-- IMPORT partials/category-selector.tpl -->
			</div>
			{{{ end }}}

			<!-- IF showHandleInput -->
			<div data-component="composer/handle">
				<input class="handle form-control h-100" type="text" tabindex="1" placeholder="[[topic:composer.handle_placeholder]]" value="{handle}" />
			</div>
			<!-- ENDIF showHandleInput -->
			<div data-component="composer/title">
				<!-- IF isTopicOrMain -->
				<input class="title form-control h-100" type="text" tabindex="1" placeholder="[[topic:composer.title_placeholder]]" value="{title}"/>
				<!-- ELSE -->
				<span class="title h-100">[[topic:composer.replying_to, "{title}"]]</span>
				<!-- ENDIF isTopicOrMain -->
				<div id="quick-search-container" class="quick-search-container mt-2 dropdown-menu d-block p-2 hidden">
					<div class="text-center loading-indicator"><i class="fa fa-spinner fa-spin"></i></div>
					<div class="quick-search-results-container"></div>
				</div>
			</div>

			<div class="float-end draft-icon hidden-xs hidden-sm"></div>

			<div class="display-scheduler float-end hidden-sm hidden-xs{{{ if !canSchedule }}} hidden{{{ end }}}">
				<i class="fa fa-clock-o"></i>
			</div>

			<div class="btn-group float-end action-bar hidden-sm hidden-xs">
				<button class="btn btn-outline-secondary composer-discard" data-action="discard" tabindex="-1"><i class="fa fa-times"></i> [[topic:composer.discard]]</button>

				<button class="btn btn-primary composer-submit" data-action="post" tabindex="6" data-text-variant=" [[topic:composer.schedule]]"><i class="fa fa-check"></i> [[topic:composer.submit]]</button>
				{{{ if submitOptions.length }}}
				<button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
					<span class="caret"></span>
					<span class="sr-only">[[topic:composer.additional-options]]</span>
				</button>
				<ul class="dropdown-menu">{{{ each submitOptions }}}<li><a href="#" data-action="{./action}">{./text}</a></li>{{{ end }}}</ul>
				{{{ end }}}
			</div>
		</div>

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

		<div class="write-preview-container">
			<div class="write-container me-1">
				<div class="help-text text-muted">
					<span class="help hidden">[[modules:composer.compose]] <i class="fa fa-question-circle"></i></span>
					<span class="toggle-preview hide">[[modules:composer.show_preview]]</span>
				</div>
				<div class="float-end draft-icon hidden-md hidden-lg"></div>
				<textarea class="write" tabindex="4" placeholder="[[modules:composer.textarea.placeholder]]">{body}</textarea>
			</div>
			<div class="hidden-sm hidden-xs preview-container ms-1">
				<div class="help-text text-muted">
					<span class="toggle-preview">[[modules:composer.hide_preview]]</span>
				</div>
				<div class="preview card card-body bg-light"></div>
			</div>
		</div>

		<!-- IF isTopicOrMain -->
		<!-- IMPORT partials/composer-tags.tpl -->
		<!-- ENDIF isTopicOrMain -->

		<div class="imagedrop"><div>[[topic:composer.drag_and_drop_images]]</div></div>

		<div class="resizer"><div class="trigger text-center"><i class="fa"></i></div></div>
	</div>
</div>
