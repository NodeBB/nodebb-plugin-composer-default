<div class="d-flex justify-content-between gap-2 align-items-center formatting-bar m-0">
	<ul class="list-unstyled mb-0 d-flex formatting-group gap-2 overflow-auto ghost-scrollbar" style="min-width: 0;">
		{{{ each formatting }}}
			{{{ if ./spacer }}}
			<li class="small spacer"></li>
			{{{ else }}}
			{{{ if ((isTopicOrMain && ./visibility.main) || (!isTopicOrMain && ./visibility.reply)) }}}
			{{{ if ./dropdownItems.length }}}
			<li class="dropdown dropdown-left bottom-sheet {./visibility.class}" title="{{tx(./title)}}">
				<button class="btn btn-sm btn-link text-reset" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" aria-label="{{tx(./title)}}">
					<i class="{./className}"></i>
				</button>
				<ul class="dropdown-menu p-1" role="menu">
				{{{ each ./dropdownItems }}}
					<li>
						<a href="#" data-format="{./name}" class="dropdown-item rounded-1 position-relative" role="menuitem">
							<i class="{./className} text-secondary"></i> {{tx(./text)}}
							{{{ if ./badge }}}
							<span class="px-1 position-absolute top-0 start-100 translate-middle-x badge rounded text-bg-info"></span>
							{{{ end }}}
						</a>
					</li>
				{{{ end }}}
				</ul>
			</li>
			{{{ else }}}
			<li title="{{tx(./title)}}" class="{./visibility.class}">
				<button data-format="{./name}" class="btn btn-sm btn-link text-reset position-relative" aria-label="{{tx(./title)}}">
					<i class="{./className}"></i>
					{{{ if ./badge }}}
					<span class="px-1 position-absolute top-0 start-100 translate-middle-x badge rounded text-bg-info"></span>
					{{{ end }}}
				</button>
			</li>
			{{{ end }}}
			{{{ end }}}
			{{{ end }}}
		{{{ end }}}

		<form id="fileForm" method="post" enctype="multipart/form-data">
			<input type="file" id="files" name="files[]" multiple class="hide"/>
		</form>
	</ul>
	<div class="d-flex align-items-center gap-1">
		<div class="draft-icon m-2 hidden-xs hidden-sm"></div>
		<button class="btn btn-sm btn-link py-2 text-body fw-semibold text-nowrap" data-action="preview">
			<i class="fa fa-eye"></i>
			<span class="d-none d-xl-inline show-text">[[modules:composer.show-preview]]</span>
			<span class="d-none d-xl-inline hide-text">[[modules:composer.hide-preview]]</span>
		</button>
		{{{ if composer:showHelpTab }}}
		<button class="btn btn-sm btn-link py-2 text-body fw-semibold text-nowrap" data-action="help">
			<i class="fa fa-question"></i>
			<span class="d-none d-xl-inline">[[modules:composer.help]]</span>
		</button>
		{{{ end }}}
	</div>
</div>

