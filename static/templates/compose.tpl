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

		<!-- IMPORT partials/composer-title-container.tpl -->

		<!-- IMPORT partials/composer-formatting.tpl -->

		<!-- IMPORT partials/composer-write-preview.tpl -->

		<!-- IF isTopicOrMain -->
		<!-- IMPORT partials/composer-tags.tpl -->
		<!-- ENDIF isTopicOrMain -->
	</div>
</div>
