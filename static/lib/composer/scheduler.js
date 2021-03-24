'use strict';

/* globals define, app */

define('composer/scheduler', ['benchpress', 'bootbox'], function (Benchpress, bootbox) {
	const scheduler = {};
	const state = {
		timestamp: 0,
		open: false,
	};
	let displayBtnCons = [];
	let displayBtns;
	let submitBtn;
	let submitIcon;
	let dateInput;
	let timeInput;

	scheduler.init = function ($postContainer) {
		displayBtnCons = $postContainer[0].querySelectorAll('.display-scheduler');
		displayBtns = $postContainer[0].querySelectorAll('.display-scheduler i');
		submitBtn = $postContainer[0].querySelector('.composer-submit:not(.btn-sm)');
		submitIcon = submitBtn.querySelector('i');

		displayBtns.forEach(el => el.addEventListener('click', openModal));
	};

	scheduler.getTimestamp = function () {
		if (!scheduler.isActive() || isNaN(state.timestamp)) {
			return 0;
		}
		return state.timestamp;
	};

	scheduler.isActive = function () {
		return state.timestamp > 0;
	};

	scheduler.isOpen = function () {
		return state.open;
	};

	scheduler.reset = function () {
		state.timestamp = 0;
	};

	scheduler.onChangeCategory = function (categoryData) {
		toggleDisplayButtons(categoryData.privileges['topics:schedule']);
		if (state.timestamp > 0) {
			toggleItems();
		}
		scheduler.reset();
	};

	async function openModal() {
		const html = await Benchpress.render('modals/topic-scheduler');
		bootbox.dialog({
			message: html,
			title: '[[modules:composer.schedule-for]]',
			className: 'topic-scheduler',
			onShown: initModal,
			onHidden: handleOnHidden,
			onEscape: true,
			buttons: {
				cancel: {
					label: state.timestamp ? '[[modules:composer.cancel-scheduling]]' : '[[modules:bootbox.cancel]]',
					className: state.timestamp ? 'btn-warning' : 'btn-default',
					callback: cancelScheduling,
				},
				set: {
					label: '[[modules:composer.set-schedule-date]]',
					className: 'btn-primary',
					callback: setTimestamp,
				},
			},
		});
	}

	function initModal(ev) {
		state.open = true;
		const schedulerContainer = ev.target.querySelector('.datetime-picker');
		dateInput = schedulerContainer.querySelector('input[type="date"]');
		timeInput = schedulerContainer.querySelector('input[type="time"]');
		initDateTimeInputs();
	}

	function handleOnHidden() {
		state.open = false;
	}

	function initDateTimeInputs() {
		const d = new Date();
		// Update min. selectable date and time
		const nowLocalISO = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toJSON();
		dateInput.setAttribute('min', nowLocalISO.slice(0, 10));
		timeInput.setAttribute('min', nowLocalISO.slice(11, -8));

		if (scheduler.isActive()) {
			const scheduleDate = new Date(state.timestamp - (d.getTimezoneOffset() * 60000)).toJSON();
			dateInput.value = scheduleDate.slice(0, 10);
			timeInput.value = scheduleDate.slice(11, -8);
		}
	}

	function setTimestamp() {
		const bothFilled = dateInput.value && timeInput.value;
		const timestamp = new Date(`${dateInput.value} ${timeInput.value}`).getTime();
		if (!bothFilled || isNaN(timestamp) || timestamp < Date.now()) {
			state.timestamp = 0;
			const message = timestamp < Date.now() ? '[[error:scheduling-to-past]]' : '[[error:invalid-schedule-date]]';
			app.alert({
				type: 'danger',
				timeout: 3000,
				title: '',
				alert_id: 'post_error',
				message,
			});
			return false;
		}
		if (!state.timestamp) {
			toggleItems();
		}
		state.timestamp = timestamp;
	}

	function cancelScheduling() {
		if (!state.timestamp) {
			return;
		}
		if (state.timestamp > 0) {
			toggleItems();
		}
		state.timestamp = 0;
	}

	function toggleItems() {
		displayBtns.forEach(btn => btn.classList.toggle('active'));
		submitIcon.classList.toggle('fa-check');
		submitIcon.classList.toggle('fa-clock-o');
		// Toggle submit button text
		const prevText = submitBtn.lastChild.textContent;
		const nextText = submitBtn.getAttribute('data-text-variant');
		submitBtn.setAttribute('data-text-variant', prevText);
		submitBtn.lastChild.textContent = nextText;
	}

	function toggleDisplayButtons(show) {
		displayBtnCons.forEach(btn => btn.classList.toggle('hidden', !show));
	}

	return scheduler;
});
