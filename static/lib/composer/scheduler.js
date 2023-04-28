'use strict';

define('composer/scheduler', ['benchpress', 'bootbox', 'alerts', 'translator'], function (
	Benchpress,
	bootbox,
	alerts,
	translator
) {
	const scheduler = {};
	const state = {
		timestamp: 0,
		open: false,
		edit: false,
		posts: {},
	};
	let displayBtnCons = [];
	let displayBtns;
	let cancelBtn;
	let submitContainer;
	let submitOptionsCon;

	const dropdownDisplayBtn = {
		el: null,
		defaultText: '',
		activeText: '',
	};

	const submitBtn = {
		el: null,
		icon: null,
		defaultText: '',
		activeText: '',
	};
	let dateInput;
	let timeInput;

	$(window).on('action:composer.activate', handleOnActivate);

	scheduler.init = function ($postContainer, posts) {
		state.timestamp = 0;
		state.posts = posts;

		translator.translateKeys(['[[topic:composer.post-later]]', '[[modules:composer.change-schedule-date]]']).then((translated) => {
			dropdownDisplayBtn.defaultText = translated[0];
			dropdownDisplayBtn.activeText = translated[1];
		});

		displayBtnCons = $postContainer[0].querySelectorAll('.display-scheduler');
		displayBtns = $postContainer[0].querySelectorAll('.display-scheduler i');
		dropdownDisplayBtn.el = $postContainer[0].querySelector('.dropdown-item.display-scheduler');
		cancelBtn = $postContainer[0].querySelector('.dropdown-item.cancel-scheduling');
		submitContainer = $postContainer.find('[component="composer/submit/container"]');
		submitOptionsCon = $postContainer.find('[component="composer/submit/options/container"]');

		submitBtn.el = $postContainer[0].querySelector('.composer-submit:not(.btn-sm)');
		submitBtn.icon = submitBtn.el.querySelector('i');
		submitBtn.defaultText = submitBtn.el.lastChild.textContent;
		submitBtn.activeText = submitBtn.el.getAttribute('data-text-variant');

		cancelBtn.addEventListener('click', cancelScheduling);
		displayBtnCons.forEach(el => el.addEventListener('click', openModal));
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
		toggleItems(false);
		const optionsVisible = categoryData.privileges['topics:schedule'] || submitOptionsCon.attr('data-submit-options') > 0;
		submitContainer.find('.composer-submit').toggleClass('rounded-1', !optionsVisible);
		submitOptionsCon.toggleClass('hidden', !optionsVisible);
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
					className: (state.timestamp ? 'btn-warning' : 'btn-outline-secondary') + (state.edit ? ' hidden' : ''),
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

	function handleOnActivate(ev, { post_uuid }) {
		state.edit = false;

		const postData = state.posts[post_uuid];
		if (postData && postData.isMain && postData.timestamp > Date.now()) {
			state.timestamp = postData.timestamp;
			state.edit = true;
			toggleItems();
		}
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
			alerts.alert({
				type: 'danger',
				timeout: 3000,
				title: '',
				alert_id: 'post_error',
				message,
			});
			return false;
		}
		if (!state.timestamp) {
			toggleItems(true);
		}
		state.timestamp = timestamp;
	}

	function cancelScheduling() {
		if (!state.timestamp) {
			return;
		}
		toggleItems(false);
		state.timestamp = 0;
	}

	function toggleItems(active = true) {
		displayBtns.forEach(btn => btn.classList.toggle('active', active));
		if (submitBtn.icon) {
			submitBtn.icon.classList.toggle('fa-check', !active);
			submitBtn.icon.classList.toggle('fa-clock-o', active);
		}
		if (dropdownDisplayBtn.el) {
			dropdownDisplayBtn.el.textContent = active ? dropdownDisplayBtn.activeText : dropdownDisplayBtn.defaultText;
			cancelBtn.classList.toggle('hidden', !active);
		}
		// Toggle submit button text
		submitBtn.el.lastChild.textContent = active ? submitBtn.activeText : submitBtn.defaultText;
	}

	function toggleDisplayButtons(show) {
		displayBtnCons.forEach(btn => btn.classList.toggle('hidden', !show));
	}

	return scheduler;
});
