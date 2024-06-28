const IG_BASE_URL = window.location.origin + '/';
const IG_PROFILE_HASH = '69cba40317214236af40e7efa697781d';
const IG_POST_HASH = '9f8827793ef34641b2fb195d4d41151c';
const IG_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const IG_POST_REGEX = /\/(p|tv|reel|reels)\/([A-Za-z0-9_-]*)(\/?)/;
const IG_STORY_REGEX = /\/(stories)\/(.*?)\/(\d*)(\/?)/;
const IG_HIGHLIGHT_REGEX = /\/(stories)\/(highlights)\/(\d*)(\/?)/;
const APP_KEYS = Object.freeze({
	_DEFAULT_DOWNLOAD_USER: '_DEFAULT_DOWNLOAD_USER',
});
const IG_APP_ID = (() => {
	const jsons = Array.from(document.querySelectorAll('script[type="application/json"]'))
		.find(item => item.innerText?.includes('X-IG-App-ID'))
		?.innerText;
	const jsonData = isValidJson(jsons) ? JSON.parse(jsons) : null;
	return jsonData ? findValueByKey(JSON.parse(jsons), 'X-IG-App-ID') : '936619743392459';
})();

const DEFAULT_DOWNLOAD_USER = Object.freeze((() => {
	const data = {
		username: '',
		id: '',
	};
	const load = () => {
		const localStorageData = isValidJson(localStorage.getItem(APP_KEYS._DEFAULT_DOWNLOAD_USER)) ?
			JSON.parse(localStorage.getItem(APP_KEYS._DEFAULT_DOWNLOAD_USER)) : null;
		if (localStorageData && localStorageData.id && localStorageData.username) {
			data.username = localStorageData.username;
			data.id = localStorageData.id;
		}
		else save();
	};
	const save = () => {
		localStorage.setItem(APP_KEYS._DEFAULT_DOWNLOAD_USER, JSON.stringify(data));
	};
	return {
		get username() { return data.username; },
		set username(value) { data.username = value; },
		get id() { return data.id; },
		set id(value) { data.id = value; },
		load: load,
		save: save
	};
})());

const appState = Object.freeze((() => {
	let currentDisplay = '';
	const current = {
		shortcode: '',
		username: '',
		highlights: '',
	};
	const previous = {
		shortcode: '',
		username: '',
		highlights: '',
	};
	return {
		get currentDisplay() { return currentDisplay; },
		set currentDisplay(value) { if (['post', 'stories', 'highlights'].includes(value)) currentDisplay = value; },
		current: Object.freeze({
			get shortcode() { return current.shortcode; },
			set shortcode(value) {
				current.shortcode = value;
				downloadPostPhotos().then(data => {
					renderMedias(data);
					currentDisplay = 'post';
				});
			},
			get username() { return current.username; },
			set username(value) {
				current.username = value;
				downloadStoryPhotos('stories').then(data => {
					renderMedias(data);
					currentDisplay = 'stories';
				});
			},
			get highlights() { return current.highlights; },
			set highlights(value) {
				current.highlights = value;
				downloadStoryPhotos('highlights').then(data => {
					renderMedias(data);
					currentDisplay = 'hightlights';
				});
			},
		}),
		setCurrentShortcode() {
			const page = window.location.pathname.match(IG_POST_REGEX);
			if (page) current.shortcode = page[2];
		},
		setCurrentUsername() {
			const page = window.location.pathname.match(IG_STORY_REGEX);
			if (page && page[2] !== 'highlights') current.username = page[2];
		},
		setCurrentHightlightsID() {
			const page = window.location.pathname.match(IG_HIGHLIGHT_REGEX);
			if (page) current.highlights = page[3];
		},
		setPreviousValues() {
			Object.keys(current).forEach(key => { previous[key] = current[key]; });
		},
		getFieldChange() {
			if (current.highlights !== previous.highlights) return 'highlights';
			if (current.username !== previous.username) return 'stories';
			if (current.shortcode !== previous.shortcode) return 'post';
			return 'none';
		},
		async setDefaultShortcode(profileID = '') {
			const apiURL = new URL('/graphql/query/', IG_BASE_URL);
			apiURL.searchParams.set('query_hash', IG_PROFILE_HASH);
			apiURL.searchParams.set('variables', JSON.stringify({
				id: profileID,
				first: 1
			}));
			try {
				const respone = await fetch(apiURL.href);
				const json = await respone.json();
				current.shortcode = json.data.user['edge_owner_to_timeline_media'].edges[0].node.shortcode;
			} catch (error) {
				console.log(error);
			}
		}
	};
})());

(() => {
	function createElement(htmlString) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, 'text/html').body;
		const fragment = document.createDocumentFragment();
		fragment.append(...doc.childNodes);
		return fragment;
	}
	function initUI() {
		const manifestData = chrome.runtime.getManifest();
		document.body.appendChild(createElement(
			`<div class="display-container hide">
				<div class="title-container">
					<span title="${manifestData.name} v${manifestData.version}">Photos</span>
					<button class="esc-button">&times</button>
				</div>
				<div class="photos-container"></div>
			</div>
			<button class="download-button">Download</button>`));
	}
	function initExtConfigUI() {
		document.body.appendChild(createElement(
			`<dialog class="ext-config-container">
				<div class="title">
					<span>Config</span>
					<form method="dialog">
						<button class="esc-button">&times</button>
					</form>
				</div>
				<form class="data-container">
					<div class="group-inputs">
						<label>Default download latest post from (username)</label>
						<input
							placeholder="Keep blank to get yourself"
							name="default_download_username"
							class="input-item"
							value="${DEFAULT_DOWNLOAD_USER.username}"/>
					</div>
				<button class="save-button">Save</button>
				</form>
			</dialog>`));
	}
	function handleEvents() {
		const ESC_BUTTON = document.querySelector('.esc-button');
		const TITLE_CONTAINER = document.querySelector('.title-container').firstElementChild;
		const DISPLAY_CONTAINER = document.querySelector('.display-container');
		const EXT_CONFIG_CONTAINER = document.querySelector('.ext-config-container');
		const DOWNLOAD_BUTTON = document.querySelector('.download-button');
		const IGNORE_FOCUS_ELEMENTS = ['INPUT', 'TEXTAREA'];
		const ESC_EVENT_KEYS = ['Escape', 'C', 'c'];
		const DOWNLOAD_EVENT_KEYS = ['D'];
		const SELECT_EVENT_KEYS = ['S', 's'];
		function setTheme() {
			const isDarkMode = document.documentElement.classList.contains('_aa4d');
			if (isDarkMode) {
				DISPLAY_CONTAINER.classList.add('dark');
				DISPLAY_CONTAINER.firstElementChild.classList.add('dark');
				document.querySelector('.ext-config-container')?.classList.add('dark');
			}
			else {
				DISPLAY_CONTAINER.classList.remove('dark');
				DISPLAY_CONTAINER.firstElementChild.classList.remove('dark');
				document.querySelector('.ext-config-container')?.classList.remove('dark');
			}
		}
		function pauseVideo() {
			if (DISPLAY_CONTAINER.classList.contains('hide')) {
				DISPLAY_CONTAINER.querySelectorAll('video').forEach(video => {
					video.pause();
				});
			}
		}
		function toggleSelectMode() {
			if (TITLE_CONTAINER.classList.contains('multi-select')) {
				DISPLAY_CONTAINER.querySelectorAll('.overlay').forEach(element => {
					element.classList.add('show');
				});
			}
			else {
				DISPLAY_CONTAINER.querySelectorAll('.overlay').forEach(element => {
					element.classList.remove('show');
				});
			}
		}
		function handleSelectAll() {
			if (!TITLE_CONTAINER.classList.contains('multi-select')) return;
			const totalItem = Array.from(DISPLAY_CONTAINER.querySelectorAll('.overlay:not(.saved)'));
			const totalItemChecked = Array.from(DISPLAY_CONTAINER.querySelectorAll('.overlay.checked'));
			if (totalItemChecked.length !== totalItem.length) totalItem.forEach(item => {
				if (!item.classList.contains('saved')) item.classList.add('checked');
			});
			else totalItem.forEach(item => { item.classList.remove('checked'); });
		}
		const handleTheme = new MutationObserver(setTheme);
		const handleVideo = new MutationObserver(pauseVideo);
		const selectHandler = new MutationObserver(toggleSelectMode);
		handleTheme.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});
		handleVideo.observe(DISPLAY_CONTAINER, {
			attributes: true,
			attributeFilter: ['class']
		});
		selectHandler.observe(TITLE_CONTAINER, {
			attributes: true,
			attributeFilter: ['class']
		});
		ESC_BUTTON.addEventListener('click', () => {
			DISPLAY_CONTAINER.classList.add('hide');
		});
		window.addEventListener('keydown', (e) => {
			if (window.location.pathname.startsWith('/direct')) return;
			if (IGNORE_FOCUS_ELEMENTS.includes(e.target.tagName)) return;
			if (e.target.role === 'textbox') return;
			if (DOWNLOAD_EVENT_KEYS.includes(e.key)) {
				DOWNLOAD_BUTTON.dispatchEvent(new Event('mousedown'));
				return DOWNLOAD_BUTTON.dispatchEvent(new Event('mouseup'));
			}
			if (ESC_EVENT_KEYS.includes(e.key)) {
				return ESC_BUTTON.click();
			}
			if (SELECT_EVENT_KEYS.includes(e.key) && !DISPLAY_CONTAINER.classList.contains('hide')) {
				return TITLE_CONTAINER.classList.toggle('multi-select');
			}
		});
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') {
				DISPLAY_CONTAINER.querySelectorAll('video').forEach(video => {
					video.pause();
				});
			}
		});
		handleLongClick(TITLE_CONTAINER, () => {
			TITLE_CONTAINER.classList.toggle('multi-select');
		}, handleSelectAll);
		handleLongClick(DOWNLOAD_BUTTON, handleDownload, () => {
			if (!EXT_CONFIG_CONTAINER.open) EXT_CONFIG_CONTAINER.showModal();
		});
		window.addEventListener('online', () => {
			DISPLAY_CONTAINER.querySelectorAll('img , video').forEach(media => {
				media.src = media.src;
			});
		});
		window.addEventListener('pathChanged', () => {
			if (window.location.pathname.startsWith('/direct')) DOWNLOAD_BUTTON.setAttribute('hidden', 'true');
			else DOWNLOAD_BUTTON.removeAttribute('hidden');
		});
		document.querySelector('form.data-container').addEventListener('submit', e => {
			e.preventDefault();
			const saveButton = document.querySelector('button.save-button');
			const formData = new FormData(e.target);
			const interval = setInterval(() => {
				if (saveButton.textContent.length <= 3) saveButton.textContent += '.';
				else saveButton.textContent = '.';
			}, 200);
			setDefaultDownloadUser(formData.get('default_download_username'))
				.then(() => {
					saveButton.textContent = 'Saved';
					clearInterval(interval);
					if (!appState.currentDisplay) appState.setDefaultShortcode(DEFAULT_DOWNLOAD_USER.id);
				});
			saveButton.textContent = '.';
		});
		setTheme();
		if (window.location.pathname.startsWith('/direct')) DOWNLOAD_BUTTON.classList.add('hide');
	}
	function run() {
		DEFAULT_DOWNLOAD_USER.load();
		document.querySelectorAll('.display-container, .download-button, .ext-config-container').forEach(node => {
			node.remove();
		});
		initUI();
		initExtConfigUI();
		if (!appState.current.shortcode) appState.setDefaultShortcode(DEFAULT_DOWNLOAD_USER.id);
		handleEvents();
	}
	run();
})();