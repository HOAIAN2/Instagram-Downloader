const BASE_URL = 'https://www.instagram.com/'
const PROFILE_HASH = '69cba40317214236af40e7efa697781d'
const POST_HASH = '9f8827793ef34641b2fb195d4d41151c'
const POST_REGEX = /\/(p|tv|reel|reels)\/([A-Za-z0-9_-]*)(\/?)/
const STORY_REGEX = /\/(stories)\/(.*?)\/(\d*)(\/?)/
const HIGHLIGHT_REGEX = /\/(stories)\/(highlights)\/(\d*)(\/?)/
const ROUTES_CONFIG = []

const appState = Object.freeze((() => {
	let currentDisplay = ''
	const current = {
		shortcode: '',
		username: '',
		highlights: '',
	}
	const previous = {
		shortcode: '',
		username: '',
		highlights: '',
	}
	return {
		get currentDisplay() { return currentDisplay },
		set currentDisplay(value) { if (['post', 'stories', 'highlights'].includes(value)) currentDisplay = value },
		current: Object.freeze({
			get shortcode() { return current.shortcode },
			set shortcode(value) {
				current.shortcode = value
				downloadPostPhotos().then(data => {
					renderMedias(data)
					currentDisplay = 'post'
				})
			},
			get username() { return current.username },
			set username(value) {
				current.username = value
				downloadStoryPhotos('stories').then(data => {
					renderMedias(data)
					currentDisplay = 'stories'
				})
			},
			get highlights() { return current.highlights },
			set highlights(value) {
				current.highlights = value
				downloadStoryPhotos('highlights').then(data => {
					renderMedias(data)
					currentDisplay = 'hightlights'
				})
			},
		}),
		setCurrentShortcode() {
			const page = window.location.pathname.match(POST_REGEX)
			if (page) current.shortcode = page[2]
		},
		setCurrentUsername() {
			const page = window.location.pathname.match(STORY_REGEX)
			if (page && page[2] !== 'highlights') current.username = page[2]
		},
		setCurrentHightlightsID() {
			const page = window.location.pathname.match(HIGHLIGHT_REGEX)
			if (page) current.highlights = page[3]
		},
		setPreviousValues() {
			Object.keys(current).forEach(key => { previous[key] = current[key] })
		},
		getFieldChange() {
			if (current.highlights !== previous.highlights) return 'highlights'
			if (current.username !== previous.username) return 'stories'
			if (current.shortcode !== previous.shortcode) return 'post'
			return 'none'
		},
		async setDefaultShortcode(profileID = '') {
			const apiURL = new URL('/graphql/query/', BASE_URL)
			apiURL.searchParams.set('query_hash', PROFILE_HASH)
			apiURL.searchParams.set('variables', JSON.stringify({
				id: profileID,
				first: 1
			}))
			try {
				const respone = await fetch(apiURL.href)
				const json = await respone.json()
				current.shortcode = json.data.user['edge_owner_to_timeline_media'].edges[0].node.shortcode
			} catch (error) {
				console.log(error)
			}
		}
	}
})())

function resetDownloadState() {
	const DOWNLOAD_BUTTON = document.querySelector('.download-button')
	DOWNLOAD_BUTTON.classList.remove('loading')
	DOWNLOAD_BUTTON.textContent = 'Download'
	DOWNLOAD_BUTTON.disabled = false
}

function saveFile(blob, fileName) {
	const a = document.createElement('a')
	a.download = fileName
	a.href = URL.createObjectURL(blob)
	a.click()
	URL.revokeObjectURL(a.href)
}

async function saveMedia(media, fileName) {
	try {
		const respone = await fetch(media.src)
		const blob = await respone.blob()
		saveFile(blob, fileName)
		media.nextElementSibling.classList.remove('check')
		media.nextElementSibling.classList.add('saved')
	} catch (error) {
		console.log(error)
	}
}

async function saveZip() {
	const DOWNLOAD_BUTTON = document.querySelector('.download-button')
	DOWNLOAD_BUTTON.classList.add('loading')
	DOWNLOAD_BUTTON.textContent = 'Loading...'
	DOWNLOAD_BUTTON.disabled = true
	let count = 0
	const zip = new JSZip()
	const medias = Array.from(document.querySelectorAll('.overlay.checked')).map(item => item.previousElementSibling)
	const zipFileName = medias[0].title.split(' | ').slice(1, 5).join('_') + '.zip'
	async function fetchSelectedMedias() {
		const results = await Promise.allSettled(medias.map(async (media) => {
			const res = await fetch(media.src)
			const blob = await res.blob()
			const data = {
				title: media.title.split(' | ').slice(1, 5).join('_'),
				data: blob
			}
			if (media.nodeName === 'VIDEO') data.title = `${data.title}.mp4`
			else data.title = `${data.title}.jpeg`
			count++
			DOWNLOAD_BUTTON.textContent = `${count}/${medias.length}`
			return data
		}))
		results.forEach(promise => {
			if (promise.status === 'rejected') throw new Error('Fail to fetch')
			zip.file(promise.value.title, promise.value.data, { base64: true })
		})
	}
	try {
		await fetchSelectedMedias()
		const blob = await zip.generateAsync({ type: 'blob' }, ((metadata) => {
			DOWNLOAD_BUTTON.textContent = `${Math.floor(metadata.percent)} %`
		}))
		saveFile(blob, zipFileName)
		document.querySelectorAll('.overlay.checked').forEach(element => {
			element.classList.remove('checked')
			element.classList.add('saved')
		})
		resetDownloadState()
	} catch (error) {
		console.log(error)
		resetDownloadState()
	}
}

function getAuthOptions() {
	const csrftoken = document.cookie.split(' ')[2].split('=')[1]
	const claim = sessionStorage.getItem('www-claim-v2')
	const options = {
		headers: {
			'x-asbd-id': '198387',
			'x-csrftoken': csrftoken,
			'x-ig-app-id': '936619743392459',
			'x-ig-www-claim': claim,
			'x-instagram-ajax': '1006598911',
			'x-requested-with': 'XMLHttpRequest'
		},
		referrer: 'https://www.instagram.com',
		referrerPolicy: 'strict-origin-when-cross-origin',
		method: 'GET',
		mode: 'cors',
		credentials: 'include'
	}
	return options
}

function shouldDownload() {
	appState.setCurrentShortcode()
	appState.setCurrentUsername()
	appState.setCurrentHightlightsID()
	function getCurrentPage() {
		const currentPath = window.location.pathname
		if (currentPath.match(POST_REGEX)) return 'post'
		if (currentPath.match(STORY_REGEX)) {
			if (currentPath.match(HIGHLIGHT_REGEX)) return 'highlights'
			return 'stories'
		}
		return 'none'
	}
	const currentPage = getCurrentPage()
	const valueChange = appState.getFieldChange()
	if (['highlights', 'stories', 'post'].includes(currentPage)) {
		if (currentPage === valueChange) return valueChange
		if (appState.currentDisplay !== currentPage) return currentPage
	}
	if (!document.querySelector('.photos-container').childElementCount) return 'post'
	return 'none'
}

function setDownloadState(state = 'ready') {
	const DOWNLOAD_BUTTON = document.querySelector('.download-button')
	const PHOTOS_CONTAINER = document.querySelector('.photos-container')
	const options = {
		ready() {
			DOWNLOAD_BUTTON.classList.add('loading')
			DOWNLOAD_BUTTON.textContent = 'Loading...'
			DOWNLOAD_BUTTON.disabled = true
			PHOTOS_CONTAINER.replaceChildren()
		},
		fail() { resetDownloadState() },
		success() {
			DOWNLOAD_BUTTON.disabled = false
			appState.setPreviousValues()
			const photosArray = PHOTOS_CONTAINER.querySelectorAll('img , video')
			let loadedPhotos = 0
			function countLoaded() {
				loadedPhotos++
				if (loadedPhotos === photosArray.length) resetDownloadState()
			}
			photosArray.forEach(media => {
				if (media.tagName === 'IMG') {
					media.addEventListener('load', countLoaded)
					media.addEventListener('error', countLoaded)
				}
				else {
					media.addEventListener('loadeddata', countLoaded)
					media.addEventListener('abort', countLoaded)
				}
			})
		}
	}
	options[state]()
}

async function handleDownload() {
	let data = null
	const TITLE_CONTAINER = document.querySelector('.title-container').firstElementChild
	const DISPLAY_CONTAINER = document.querySelector('.display-container')
	const option = shouldDownload()
	const totalItemChecked = Array.from(document.querySelectorAll('.overlay.checked'))
	if (TITLE_CONTAINER.classList.contains('multi-select')
		&& !DISPLAY_CONTAINER.classList.contains('hide')
		&& option === 'none'
		&& totalItemChecked.length !== 0) {
		if (totalItemChecked.length === 1) {
			const media = totalItemChecked[0].previousElementSibling
			saveMedia(media, media.title.split(' | ').slice(1, 5).join('_') + `${media.nodeName === 'VIDEO' ? '.mp4' : '.jpeg'}`)
		}
		else saveZip()
		return
	}
	DISPLAY_CONTAINER.classList.remove('hide')
	if (option === 'none') return
	setDownloadState('ready')
	option === 'post' ? data = await downloadPostPhotos() : data = await downloadStoryPhotos(option)
	if (!data) return setDownloadState('fail')
	appState.currentDisplay = option
	renderMedias(data)
}

function renderMedias(data) {
	const TITLE_CONTAINER = document.querySelector('.title-container').firstElementChild
	const PHOTOS_CONTAINER = document.querySelector('.photos-container')
	PHOTOS_CONTAINER.replaceChildren()
	if (!data) return
	data.media.forEach(item => {
		const date = new Date(data.date * 1000).toISOString().split('T')[0]
		const attributes = {
			class: 'photos-item',
			src: item.url,
			title: `${data.user.fullName} | ${data.user.username} | ${item.id} | ${date}`,
			controls: ''
		}
		const ITEM_TEMPLATE =
			`<div>
				${item.isVideo ? '<video></video>' : '<img/>'}
				<div class="overlay"></div>
			</div>`
		const itemDOM = new DOMParser().parseFromString(ITEM_TEMPLATE, 'text/html').body.firstElementChild
		const media = itemDOM.firstElementChild
		const selectBox = itemDOM.querySelector('.overlay')
		Object.keys(attributes).forEach(key => {
			if (item.isVideo) media.setAttribute(key, attributes[key])
			else if (key !== 'controls') media.setAttribute(key, attributes[key])
		})
		PHOTOS_CONTAINER.appendChild(itemDOM)
		media.addEventListener('click', () => {
			if (TITLE_CONTAINER.classList.contains('multi-select')) {
				selectBox.classList.toggle('checked')
			}
			else saveMedia(media, media.title.split(' | ').slice(1, 5).join('_') + `${item.isVideo ? '.mp4' : '.jpeg'}`)
		})
	})
	TITLE_CONTAINER.classList.remove('multi-select')
	setDownloadState('success')
}

function initUI() {
	const manifestData = chrome.runtime.getManifest()
	const DISPLAY_CONTAINER =
		`<div class="display-container hide">
			<div class="title-container">
				<span title="${manifestData.name} v${manifestData.version}">Photos</span>
				<span class="esc-button">&times</span>
			</div>
			<div class="photos-container"></div>
		</div>
		<button class="download-button">Download</button>`
	const DISPLAY_NODE = new DOMParser().parseFromString(DISPLAY_CONTAINER, 'text/html').body
	DISPLAY_NODE.childNodes.forEach(node => { document.body.appendChild(node) })
}

function handleLongClick(element, shortClickHandler = () => { }, longClickHandler = () => { }, delay = 400) {
	element.addEventListener('mousedown', () => {
		let count = 0
		const intervalID = setInterval(() => {
			count = count + 10
			if (count >= delay) {
				clearInterval(intervalID)
				longClickHandler()
			}
		}, 10)
		element.addEventListener('mouseup', () => {
			clearInterval(intervalID)
			if (count < delay) shortClickHandler()
		}, { once: true })
	})
}

function handleEvents() {
	const ESC_BUTTON = document.querySelector('.esc-button')
	const TITLE_CONTAINER = document.querySelector('.title-container').firstElementChild
	const DISPLAY_CONTAINER = document.querySelector('.display-container')
	const DOWNLOAD_BUTTON = document.querySelector('.download-button')
	const IGNORE_FOCUS_ELEMENTS = ['INPUT', 'TEXTAREA']
	const ESC_EVENT_KEYS = ['Escape', 'C', 'c']
	const DOWNLOAD_EVENT_KEYS = ['D']
	const SELECT_EVENT_KEYS = ['S', 's']
	function setTheme() {
		const isDarkMode = document.documentElement.classList.contains('_aa4d')
		if (isDarkMode) {
			DISPLAY_CONTAINER.classList.add('dark')
			DISPLAY_CONTAINER.firstElementChild.classList.add('dark')
			document.querySelector('.ext-config-container')?.classList.add('dark')
		}
		else {
			DISPLAY_CONTAINER.classList.remove('dark')
			DISPLAY_CONTAINER.firstElementChild.classList.remove('dark')
			document.querySelector('.ext-config-container')?.classList.remove('dark')
		}
	}
	function pauseVideo() {
		if (DISPLAY_CONTAINER.classList.contains('hide')) {
			DISPLAY_CONTAINER.querySelectorAll('video').forEach(video => {
				video.pause()
			})
		}
	}
	function toggleSelectMode() {
		if (TITLE_CONTAINER.classList.contains('multi-select')) {
			DISPLAY_CONTAINER.querySelectorAll('.overlay').forEach(element => {
				element.classList.add('show')
			})
		}
		else {
			DISPLAY_CONTAINER.querySelectorAll('.overlay').forEach(element => {
				element.classList.remove('show')
			})
		}
	}
	function handleSelectAll() {
		if (!TITLE_CONTAINER.classList.contains('multi-select')) return
		const totalItem = Array.from(DISPLAY_CONTAINER.querySelectorAll('.overlay:not(.saved)'))
		const totalItemChecked = Array.from(DISPLAY_CONTAINER.querySelectorAll('.overlay.checked'))
		if (totalItemChecked.length !== totalItem.length) totalItem.forEach(item => {
			if (!item.classList.contains('saved')) item.classList.add('checked')
		})
		else totalItem.forEach(item => { item.classList.remove('checked') })
	}
	const handleTheme = new MutationObserver(setTheme)
	const handleVideo = new MutationObserver(pauseVideo)
	const selectHandler = new MutationObserver(toggleSelectMode)
	handleTheme.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['class']
	})
	handleVideo.observe(DISPLAY_CONTAINER, {
		attributes: true,
		attributeFilter: ['class']
	})
	selectHandler.observe(TITLE_CONTAINER, {
		attributes: true,
		attributeFilter: ['class']
	})
	ESC_BUTTON.addEventListener('click', () => {
		DISPLAY_CONTAINER.classList.add('hide')
	})
	window.addEventListener('keydown', (e) => {
		if (window.location.pathname.startsWith('/direct')) return
		if (IGNORE_FOCUS_ELEMENTS.includes(e.target.tagName)) return
		if (e.target.role === 'textbox') return
		if (DOWNLOAD_EVENT_KEYS.includes(e.key)) return DOWNLOAD_BUTTON.click()
		if (ESC_EVENT_KEYS.includes(e.key)) return ESC_BUTTON.click()
		if (SELECT_EVENT_KEYS.includes(e.key) && !DISPLAY_CONTAINER.classList.contains('hide'))
			return TITLE_CONTAINER.classList.toggle('multi-select')
	})
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			DISPLAY_CONTAINER.querySelectorAll('video').forEach(video => {
				video.pause()
			})
		}
	})
	handleLongClick(TITLE_CONTAINER, () => {
		TITLE_CONTAINER.classList.toggle('multi-select')
	}, handleSelectAll)
	handleLongClick(DOWNLOAD_BUTTON, handleDownload, showExtensionConfig)
	window.addEventListener('online', () => {
		DISPLAY_CONTAINER.querySelectorAll('img , video').forEach(media => {
			media.src = media.src
		})
	})
	window.addEventListener('pathChanged', () => {
		if (window.location.pathname.startsWith('/direct')) DOWNLOAD_BUTTON.classList.add('hide')
		else DOWNLOAD_BUTTON.classList.remove('hide')
	})
	setTheme()
	if (window.location.pathname.startsWith('/direct')) DOWNLOAD_BUTTON.classList.add('hide')
}

function main() {
	const defaultDownloadUser = JSON.parse(localStorage.getItem('_default_download_user'))
	document.querySelectorAll('.display-container, .download-button').forEach(node => {
		node.remove()
	})
	initUI()
	if (!appState.current.shortcode) appState.setDefaultShortcode(defaultDownloadUser.id)
	handleEvents()
}
main()