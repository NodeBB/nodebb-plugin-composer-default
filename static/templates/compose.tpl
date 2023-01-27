<div component="composer" class="composer{{{ if resizable }}} resizable{{{ end }}}{{{ if !isTopicOrMain }}} reply{{{ end }}}"{{{ if !disabled }}} style="visibility: inherit;"{{{ end }}}>
	<div class="composer-container">
		<form id="compose-form" method="post">
			{{{ if pid }}}
			<input type="hidden" name="pid" value="{pid}" />
			<input type="hidden" name="thumb" value="{thumb}" />
			{{{ end }}}
			{{{ if tid }}}
			<input type="hidden" name="tid" value="{tid}" />
			{{{ end }}}
			{{{ if cid }}}
			<input type="hidden" name="cid" value="{cid}" />
			{{{ end }}}
			<input type="hidden" name="_csrf" value="{config.csrf_token}" />
		</form>

		<!-- IMPORT partials/composer-title-container.tpl -->

		<!-- IMPORT partials/composer-formatting.tpl -->

		<!-- IMPORT partials/composer-write-preview.tpl -->

		{{{ if isTopicOrMain }}}
		<!-- IMPORT partials/composer-tags.tpl -->
		{{{ end }}}
	</div>
</div>
