<div component="composer" class="composer {{{ if resizable }}} resizable{{{ end }}}{{{ if !isTopicOrMain }}} reply{{{ end }}}">
	<div class="composer-container d-flex flex-column gap-1 h-100">
		<!-- mobile header -->
		<nav class="navbar fixed-top mobile-navbar text-bg-primary d-flex d-md-none flex-nowrap gap-1 px-1">
			<div class="btn-group">
				<button class="btn btn-sm btn-primary composer-discard fs-5" data-action="discard" tabindex="-1"><i class="fa fa-fw fa-times"></i></button>
				<button class="btn btn-sm btn-primary composer-minimize fs-5" data-action="minimize" tabindex="-1"><i class="fa fa-fw fa-minus"></i></button>
			</div>
			{{{ if isTopic }}}
			<div class="flex-1" style="min-width: 0px;">
				<!-- IMPORT partials/category/selector-dropdown-left.tpl -->
			</div>
			{{{ end }}}
			{{{ if !isTopicOrMain }}}
			<h4 class="title text-center text-bg-primary text-truncate fs-6 mb-0 px-2">{titleLabel}</h4>
			{{{ end }}}

			<div class="d-flex gap-1 flex-nowrap">
				<button class="btn btn-sm btn-primary display-scheduler fs-5 {{{ if !canSchedule }}} hidden{{{ end }}}">
					<i class="fa fa-fw fa-clock-o"></i>
				</button>
				<button class="btn btn-sm btn-primary composer-submit fs-5" data-action="post" tabindex="-1"><i class="fa fa-fw fa-chevron-right"></i></button>
			</div>
		</nav>
		<div class="p-2 d-flex flex-column gap-1 h-100">
			<!-- IMPORT partials/composer-title-container.tpl -->

			<!-- IMPORT partials/composer-formatting.tpl -->

			<!-- IMPORT partials/composer-write-preview.tpl -->

			{{{ if isTopicOrMain }}}
			<!-- IMPORT partials/composer-tags.tpl -->
			{{{ end }}}

			<div class="imagedrop"><div>[[topic:composer.drag-and-drop-images]]</div></div>

			<div class="resizer position-absolute w-100 bottom-100 pe-3 border-bottom">
				<div class="trigger text-center">
					<div class="handle d-inline-block px-2 py-1 border bg-body">
						<i class="fa fa-fw fa-up-down"></i>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
