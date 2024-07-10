function saveFile(blob, fileName) {
	const a = document.createElement('a');
	a.download = fileName;
	a.href = URL.createObjectURL(blob);
	a.click();
	URL.revokeObjectURL(a.href);
}

function getAuthOptions() {
	const csrftoken = document.cookie.split(' ')[2].split('=')[1];
	const claim = sessionStorage.getItem('www-claim-v2');
	const options = {
		headers: {
			// Hardcode variable: a="129477";f.ASBD_ID=a in JS, can be remove
			// 'x-asbd-id': '129477',
			'x-csrftoken': csrftoken,
			'x-ig-app-id': IG_APP_ID,
			'x-ig-www-claim': claim,
			// 'x-instagram-ajax': '1006598911',
			'x-requested-with': 'XMLHttpRequest'
		},
		referrer: window.location.href,
		referrerPolicy: 'strict-origin-when-cross-origin',
		method: 'GET',
		mode: 'cors',
		credentials: 'include'
	};
	return options;
}

function findValueByKey(obj, key) {
	if (typeof obj !== 'object' || obj === null) return null;
	const stack = [obj];
	while (stack.length) {
		const current = stack.pop();
		if (current[key] !== undefined) return current[key];
		for (const value of Object.values(current)) {
			if (typeof value === 'object' && value !== null) stack.push(value);
		}
	}
	return null;
}

function resetDownloadState() {
	const DOWNLOAD_BUTTON = document.querySelector('.download-button');
	DOWNLOAD_BUTTON.classList.remove('loading');
	DOWNLOAD_BUTTON.textContent = 'Download';
	DOWNLOAD_BUTTON.disabled = false;
}

async function saveMedia(media, fileName) {
	try {
		const respone = await fetch(media.src);
		const blob = await respone.blob();
		saveFile(blob, fileName);
		media.nextElementSibling.classList.remove('check');
		media.nextElementSibling.classList.add('saved');
	} catch (error) {
		console.log(error);
	}
}

async function saveZip() {
	const DOWNLOAD_BUTTON = document.querySelector('.download-button');
	DOWNLOAD_BUTTON.classList.add('loading');
	DOWNLOAD_BUTTON.textContent = 'Loading...';
	DOWNLOAD_BUTTON.disabled = true;
	const medias = Array.from(document.querySelectorAll('.overlay.checked')).map(item => item.previousElementSibling);
	const zipFileName = medias[0].title.split(' | ').slice(1, 5).join('_') + '.zip';
	async function fetchSelectedMedias() {
		let count = 0;
		const results = await Promise.allSettled(medias.map(async (media) => {
			const res = await fetch(media.src);
			const blob = await res.blob();
			const data = {
				title: media.title.split(' | ').slice(1, 5).join('_'),
				data: blob
			};
			if (media.nodeName === 'VIDEO') data.title = `${data.title}.mp4`;
			else data.title = `${data.title}.jpeg`;
			count++;
			DOWNLOAD_BUTTON.textContent = `${count}/${medias.length}`;
			return data;
		}));
		results.forEach(promise => {
			if (promise.status === 'rejected') throw new Error('Fail to fetch');
		});
		return results.map(promise => promise.value);
	}
	try {
		const medias = await fetchSelectedMedias();
		const blob = await createZip(medias);
		saveFile(blob, zipFileName);
		document.querySelectorAll('.overlay.checked').forEach(element => {
			element.classList.remove('checked');
			element.classList.add('saved');
		});
		resetDownloadState();
	} catch (error) {
		console.log(error);
		resetDownloadState();
	}
}

function shouldDownload() {
	if (window.location.pathname === '/' && appState.getFieldChange() !== 'none') {
		return appState.getFieldChange();
	}
	appState.setCurrentShortcode();
	appState.setCurrentUsername();
	appState.setCurrentHightlightsId();
	function getCurrentPage() {
		const currentPath = window.location.pathname;
		if (currentPath.match(IG_POST_REGEX)) return 'post';
		if (currentPath.match(IG_STORY_REGEX)) {
			if (currentPath.match(IG_HIGHLIGHT_REGEX)) return 'highlights';
			return 'stories';
		}
		if (currentPath === '/') return 'post';
		return 'none';
	}
	const currentPage = getCurrentPage();
	const valueChange = appState.getFieldChange();
	if (['highlights', 'stories', 'post'].includes(currentPage)) {
		if (currentPage === valueChange) return valueChange;
		if (appState.currentDisplay !== currentPage) return currentPage;
	}
	if (!document.querySelector('.photos-container').childElementCount) return 'post';
	return 'none';
}

function setDownloadState(state = 'ready') {
	const DOWNLOAD_BUTTON = document.querySelector('.download-button');
	const PHOTOS_CONTAINER = document.querySelector('.photos-container');
	const options = {
		ready() {
			DOWNLOAD_BUTTON.classList.add('loading');
			DOWNLOAD_BUTTON.textContent = 'Loading...';
			DOWNLOAD_BUTTON.disabled = true;
			PHOTOS_CONTAINER.replaceChildren();
		},
		fail() { resetDownloadState(); },
		success() {
			DOWNLOAD_BUTTON.disabled = false;
			appState.setPreviousValues();
			const photosArray = PHOTOS_CONTAINER.querySelectorAll('img , video');
			let loadedPhotos = 0;
			function countLoaded() {
				loadedPhotos++;
				if (loadedPhotos === photosArray.length) resetDownloadState();
			}
			photosArray.forEach(media => {
				if (media.tagName === 'IMG') {
					media.addEventListener('load', countLoaded);
					media.addEventListener('error', countLoaded);
				}
				else {
					media.addEventListener('loadeddata', countLoaded);
					media.addEventListener('abort', countLoaded);
				}
			});
		}
	};
	options[state]();
}

async function handleDownload() {
	let data = null;
	const TITLE_CONTAINER = document.querySelector('.title-container').firstElementChild;
	const DISPLAY_CONTAINER = document.querySelector('.display-container');
	const option = shouldDownload();
	const totalItemChecked = Array.from(document.querySelectorAll('.overlay.checked'));
	if (TITLE_CONTAINER.classList.contains('multi-select')
		&& !DISPLAY_CONTAINER.classList.contains('hide')
		&& option === 'none'
		&& totalItemChecked.length !== 0) {
		if (totalItemChecked.length === 1) {
			const media = totalItemChecked[0].previousElementSibling;
			saveMedia(media, media.title.split(' | ').slice(1, 5).join('_') + `${media.nodeName === 'VIDEO' ? '.mp4' : '.jpeg'}`);
		}
		else saveZip();
		return;
	}
	requestAnimationFrame(() => { DISPLAY_CONTAINER.classList.remove('hide'); });
	if (option === 'none') return;
	setDownloadState('ready');
	option === 'post' ? data = await downloadPostPhotos() : data = await downloadStoryPhotos(option);
	if (!data) return setDownloadState('fail');
	appState.currentDisplay = option;
	renderMedias(data);
}

function renderMedias(data) {
	const TITLE_CONTAINER = document.querySelector('.title-container').firstElementChild;
	const PHOTOS_CONTAINER = document.querySelector('.photos-container');
	PHOTOS_CONTAINER.replaceChildren();
	if (!data) return;
	const fragment = document.createDocumentFragment();
	data.medias.forEach(item => {
		const date = new Date(data.date * 1000).toISOString().split('T')[0];
		const attributes = {
			class: 'photos-item',
			src: item.url,
			title: `${data.user.fullName} | ${data.user.username} | ${item.id} | ${date}`,
			controls: ''
		};
		const ITEM_TEMPLATE =
			`<div>
				${item.isVideo ? `<video preload="metadata" poster="${item.thumbnail}"></video>` : '<img/>'}
				<div class="overlay"></div>
			</div>`;
		const itemDOM = new DOMParser().parseFromString(ITEM_TEMPLATE, 'text/html').body.firstElementChild;
		const media = itemDOM.firstElementChild;
		const selectBox = itemDOM.querySelector('.overlay');
		Object.keys(attributes).forEach(key => {
			if (item.isVideo) media.setAttribute(key, attributes[key]);
			else if (key !== 'controls') media.setAttribute(key, attributes[key]);
		});
		fragment.appendChild(itemDOM);
		media.addEventListener('click', () => {
			if (TITLE_CONTAINER.classList.contains('multi-select')) {
				selectBox.classList.toggle('checked');
			}
			else saveMedia(media, media.title.split(' | ').slice(1, 5).join('_') + `${item.isVideo ? '.mp4' : '.jpeg'}`);
		});
	});
	PHOTOS_CONTAINER.appendChild(fragment);
	TITLE_CONTAINER.classList.remove('multi-select');
	setDownloadState('success');
}

async function setDefaultDownloadUser(username = '') {
	try {
		if (!username) {
			DEFAULT_DOWNLOAD_USER.username = '';
			DEFAULT_DOWNLOAD_USER.id = '';
			DEFAULT_DOWNLOAD_USER.save();
			return;
		}
		const userId = await getUserId(getAuthOptions(), username);
		if (userId) {
			DEFAULT_DOWNLOAD_USER.username = username;
			DEFAULT_DOWNLOAD_USER.id = userId;
			DEFAULT_DOWNLOAD_USER.save();
		}
	} catch (error) {
		console.log(error);
	}
}

function handleLongClick(element, shortClickHandler = () => { }, longClickHandler = () => { }, delay = 400) {
	element.addEventListener('mousedown', () => {
		let count = 0;
		const intervalId = setInterval(() => {
			count = count + 10;
			if (count >= delay) {
				clearInterval(intervalId);
				longClickHandler();
			}
		}, 10);
		element.addEventListener('mouseup', () => {
			clearInterval(intervalId);
			if (count < delay) shortClickHandler();
		}, { once: true });
	});
}

function isValidJson(string) {
	try {
		JSON.parse(string);
		return true;
	} catch {
		return false;
	}
}