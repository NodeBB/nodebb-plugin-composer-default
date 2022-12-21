<div class="title-container d-flex">
	{{{ if isTopic }}}
	<div class="category-list-container hidden-sm hidden-xs">
		<!-- IMPORT partials/category-selector.tpl -->
	</div>
	{{{ end }}}

	<!-- IF showHandleInput -->
	<div data-component="composer/handle">
		<input class="handle form-control h-100 border-0 shadow-none" type="text" tabindex="1" placeholder="[[topic:composer.handle_placeholder]]" value="{handle}" />
	</div>
	<!-- ENDIF showHandleInput -->
	<div data-component="composer/title" class="position-relative flex-grow-1">
		<!-- IF isTopicOrMain -->
		<input class="title form-control h-100 rounded-1 shadow-none" type="text" tabindex="1" placeholder="[[topic:composer.title_placeholder]]" value="{topicTitle}"/>
		<!-- ELSE -->
		<span class="title h-100">[[topic:composer.replying_to, "{topicTitle}"]]</span>
		<!-- ENDIF isTopicOrMain -->
		<div id="quick-search-container" class="quick-search-container mt-2 dropdown-menu d-block p-2 hidden">
			<div class="text-center loading-indicator"><i class="fa fa-spinner fa-spin"></i></div>
			<div class="quick-search-results-container"></div>
		</div>
	</div>

	<div class="float-end draft-icon hidden-xs hidden-sm"></div>

	<div class="action-bar hidden-sm hidden-xs">
		<button class="btn btn-sm btn-link text-body fw-semibold" data-action="hide" tabindex="-1"><i class="fa fa-angle-down"></i> [[topic:composer.hide]]</button>
		<button class="btn btn-sm btn-link composer-discard text-body fw-semibold" data-action="discard" tabindex="-1"><i class="fa fa-trash"></i> [[topic:composer.discard]]</button>
		<div class="btn-group btn-group-sm">
			<button class="btn btn-primary composer-submit fw-bold" data-action="post" tabindex="6" data-text-variant=" [[topic:composer.schedule]]"><i class="fa fa-check"></i> [[topic:composer.submit]]</button>
			{{{ if (submitOptions.length || canSchedule) }}}
			<button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
				<i class="fa fa-caret-down"></i>
				<span class="sr-only">[[topic:composer.additional-options]]</span>
			</button>
			<ul class="dropdown-menu">
				<li><a class="dropdown-item display-scheduler ">Post Later</a></li>
				{{{ each submitOptions }}}
				<li><a class="dropdown-item" href="#" data-action="{./action}">{./text}</a></li>
				{{{ end }}}</ul>
			{{{ end }}}
		</div>
	</div>
</div>