<div component="composer" class="composer<!-- IF resizable --> resizable<!-- ENDIF resizable --><!-- IF !isTopicOrMain --> reply<!-- ENDIF !isTopicOrMain -->"<!-- IF !disabled --> style="visibility: inherit;"<!-- ENDIF !disabled -->>

	<div class="composer-container">
		<form id="compose-form" method="post">
			<!-- IF pid -->
			<input type="hidden" name="pid" value="{pid}" />
			<input type="hidden" name="thumb" value="{thumb}" />
			<!-- ENDIF pid -->
			<!-- IF tid -->
			<input type="hidden" name="tid" value="{tid}" />
			<!-- ENDIF tid -->
			<!-- IF cid -->
			<input type="hidden" name="cid" value="{cid}" />
			<!-- ENDIF cid -->
			<input type="hidden" name="_csrf" value="{config.csrf_token}" />
		</form>

		<div class="title-container row">
			<!-- IF isTopic -->
			<div class="category-list-container"><!-- IMPORT partials/category-selector.tpl --></div>
			<!-- ENDIF isTopic -->
			<!-- IF isTopicOrMain -->
			<div class="display-scheduler float-end{{{ if !canSchedule }}} hidden{{{ end }}}">
				<i class="fa fa-clock-o"></i>
			</div>
			<!-- ENDIF isTopicOrMain -->
			<!-- IF showHandleInput -->
			<div class="col-sm-3 col-md-12">
				<input class="handle form-control h-100" type="text" tabindex="1" placeholder="[[topic:composer.handle_placeholder]]" value="{handle}" />
			</div>
			<!-- ENDIF showHandleInput -->
			<div class="<!-- IF isTopic -->col-lg-9<!-- ELSE -->col-lg-12<!-- ENDIF isTopic --> col-md-12">
				<!-- IF isTopicOrMain -->
				<input name="title" form="compose-form" class="title form-control h-100" type="text" tabindex="1" placeholder="[[topic:composer.title_placeholder]]" value="{topicTitle}"/>
				<!-- ELSE -->
				<span class="title h-100">[[topic:composer.replying_to, "{topicTitle}"]]</span>
				<!-- ENDIF isTopicOrMain -->
				<div id="quick-search-container" class="quick-search-container mt-2 dropdown-menu d-block p-2 hidden">
					<div class="quick-search-results-container"></div>
				</div>
			</div>
		</div>

		<div class="category-tag-row">
			<div class="btn-toolbar formatting-bar">
				<ul class="formatting-group">
					<!-- BEGIN formatting -->
						<!-- IF formatting.spacer -->
						<li class="spacer"></li>
						<!-- ELSE -->
						<!-- IF ../visibility.desktop -->
						<li tabindex="-1" data-format="{formatting.name}"><i class="{formatting.className}"></i></li>
						<!-- ENDIF ../visibility.desktop -->
						<!-- ENDIF formatting.spacer -->
					<!-- END formatting -->

					<!--[if gte IE 9]><!-->
						<!-- IF privileges.upload:post:image -->
						<li class="img-upload-btn hide" data-format="picture" tabindex="-1">
							<i class="fa fa-file-image-o"></i>
						</li>
						<!-- ENDIF privileges.upload:post:image -->
						<!-- IF privileges.upload:post:file -->
						<li class="file-upload-btn hide" data-format="upload" tabindex="-1">
							<i class="fa fa-file-o"></i>
						</li>
						<!-- ENDIF privileges.upload:post:file -->
					<!--<![endif]-->

					<form id="fileForm" method="post" enctype="multipart/form-data">
						<!--[if gte IE 9]><!-->
							<input type="file" id="files" name="files[]" multiple class="gte-ie9 hide"/>
						<!--<![endif]-->
						<!--[if lt IE 9]>
							<input type="file" id="files" name="files[]" class="lt-ie9 hide" value="Upload"/>
						<![endif]-->
					</form>
				</ul>

				<div class="btn-group float-end action-bar">
					<a href="{discardRoute}" class="btn btn-outline-secondary composer-discard" data-action="discard" tabindex="-1"><i class="fa fa-times"></i> [[topic:composer.discard]]</a>

					<button type="submit" form="compose-form" class="btn btn-primary composer-submit" data-action="post" tabindex="6" data-text-variant=" [[topic:composer.schedule]]"><i class="fa fa-check"></i> [[topic:composer.submit]]</button>
				</div>
			</div>
		</div>

		<div class="row write-preview-container">
			<div class="col-md-6 col-sm-12 write-container">
				<div class="help-text text-muted">
					[[modules:composer.compose]] <span class="help hidden"><i class="fa fa-question-circle"></i></span>
					<span class="toggle-preview hide">[[modules:composer.show_preview]]</span>
				</div>
				<textarea name="content" form="compose-form" class="write" tabindex="5" placeholder="[[modules:composer.textarea.placeholder]]"></textarea>
			</div>
			<div class="col-md-6 hidden-sm hidden-xs preview-container">
				<div class="help-text text-muted">
					<span class="toggle-preview">[[modules:composer.hide_preview]]</span>
				</div>
				<div class="preview well"></div>
			</div>
		</div>

		<!-- IF isTopicOrMain -->
		<!-- IMPORT partials/composer-tags.tpl -->
		<!-- ENDIF isTopicOrMain -->
	</div>
</div>
