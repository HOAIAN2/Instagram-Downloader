const appLog = {
    currentDisplay: '',
    current: {
        shortcode: '',
        username: '',
        highlights: '',
    },
    previous: {
        shortcode: '',
        username: '',
        highlights: '',
    }
}
const BASE_URL = 'https://www.instagram.com/'
const PROFILE_HASH = '69cba40317214236af40e7efa697781d'
const POST_HASH = '9f8827793ef34641b2fb195d4d41151c'
async function saveMedia(media, fileName) {
    const a = document.createElement('a')
    a.download = fileName
    try {
        const respone = await fetch(media.src)
        const blob = await respone.blob()
        a.href = URL.createObjectURL(blob)
        a.click()
        URL.revokeObjectURL(a.href)
    } catch (error) {
        console.log(error)
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
    setCurrentShortcode()
    setCurrentUsername()
    setCurrentHightlightsID()
    function getCurrentPage() {
        const postRegex = /\/(p|tv|reel|reels)\/(.*?)\//
        const storyRegex = /\/(stories)\/(.*?)\/(\d*?)\//
        const currentPath = window.location.pathname
        if (currentPath.match(postRegex)) return 'post'
        if (currentPath.match(storyRegex)) {
            if (currentPath.match(storyRegex)[2] === 'highlights') return 'highlights'
            return 'stories'
        }
        return 'none'
    }
    const currentPage = getCurrentPage()
    if (currentPage === 'stories') {
        if (appLog.current.username !== appLog.previous.username) return 'stories'
        if (appLog.currentDisplay !== 'stories') return 'stories'
    }
    if (currentPage === 'highlights') {
        if (appLog.current.highlights !== appLog.previous.highlights) return 'highlights'
        if (appLog.currentDisplay !== 'highlights') return 'highlights'
    }
    if (currentPage === 'post') {
        if (appLog.current.shortcode !== appLog.previous.shortcode) return 'post'
        if (appLog.currentDisplay !== 'post') return 'post'
    }
    if (!document.querySelector('.photos-container').childElementCount) return 'post'
    return 'none'
}
async function setDefaultShortcode(profileID = '51963237586') {
    const apiURL = new URL('/graphql/query/', BASE_URL)
    apiURL.searchParams.set('query_hash', PROFILE_HASH)
    apiURL.searchParams.set('variables', JSON.stringify({
        id: profileID,
        first: 1
    }))
    try {
        const respone = await fetch(apiURL.href)
        const json = await respone.json()
        appLog.current.shortcode = json.data.user['edge_owner_to_timeline_media'].edges[0].node.shortcode
    } catch (error) {
        console.log(error)
    }
}
function setDownloadState(state = 'ready', PHOTOS_CONTAINER, option = '') {
    const DOWNLOAD_BUTTON = document.querySelector('.download-button')
    function resetState() {
        DOWNLOAD_BUTTON.classList.remove('loading')
        DOWNLOAD_BUTTON.textContent = 'Download'
        DOWNLOAD_BUTTON.disabled = false
    }
    switch (state) {
        case 'ready':
            DOWNLOAD_BUTTON.classList.add('loading')
            DOWNLOAD_BUTTON.textContent = 'Loading...'
            DOWNLOAD_BUTTON.disabled = true
            PHOTOS_CONTAINER.querySelectorAll('img , video').forEach(item => {
                item.remove()
            })
            break
        case 'fail':
            resetState()
            break
        case 'success':
            DOWNLOAD_BUTTON.disabled = false
            if (option === 'post') appLog.previous.shortcode = appLog.current.shortcode
            else {
                if (option === 'stories') appLog.previous.username = appLog.current.username
                else appLog.previous.highlights = appLog.current.highlights
            }
            const photosArray = PHOTOS_CONTAINER.querySelectorAll('img , video')
            const totalPhotos = photosArray.length
            let loadedPhotos = 0
            photosArray.forEach(photo => {
                if (photo.tagName === 'IMG') {
                    photo.addEventListener('load', () => {
                        loadedPhotos++
                        if (loadedPhotos === totalPhotos) resetState()
                    })
                    photo.addEventListener('error', () => {
                        loadedPhotos++
                        if (loadedPhotos === totalPhotos) resetState()
                    })
                }
                else {
                    photo.addEventListener('loadeddata', () => {
                        loadedPhotos++
                        if (loadedPhotos === totalPhotos) resetState()
                    })
                    photo.addEventListener('abort', () => {
                        loadedPhotos++
                        if (loadedPhotos === totalPhotos) resetState()
                    })
                }
            })
            break
    }
}
async function handleDownload() {
    let data = null
    const DISPLAY_CONTAINER = document.querySelector('.display-container')
    const PHOTOS_CONTAINER = document.querySelector('.photos-container')
    DISPLAY_CONTAINER.classList.remove('hide')
    const option = shouldDownload()
    switch (option) {
        case 'none': return
        case 'post':
            setDownloadState('ready', PHOTOS_CONTAINER)
            data = await downloadPostPhotos()
            if (!data) {
                setDownloadState('fail')
                return
            }
            appLog.currentDisplay = 'post'
            break
        case 'stories':
            setDownloadState('ready', PHOTOS_CONTAINER)
            data = await downloadStoryPhotos(1)
            if (!data) {
                setDownloadState('fail')
                return
            }
            appLog.currentDisplay = 'stories'
            break
        case 'highlights':
            setDownloadState('ready', PHOTOS_CONTAINER)
            data = await downloadStoryPhotos(2)
            if (!data) {
                setDownloadState('fail')
                return
            }
            appLog.currentDisplay = 'highlights'
            break
    }
    data.media.forEach(item => {
        if (item.isVideo === true) {
            const video = document.createElement('video')
            const videoAttributes = {
                class: 'photos-items',
                src: item.url,
                title: `${data.user.fullName} | ${data.user.username} | ${item.id} | ${data.date}`,
                controls: ''
            }
            Object.keys(videoAttributes).forEach(key => {
                video.setAttribute(key, videoAttributes[key])
            })
            PHOTOS_CONTAINER.appendChild(video)
            video.addEventListener('click', () => {
                saveMedia(video, video.title.replaceAll(' | ', '_').replaceAll(data.user.fullName, '').substring(1))
            })
        }
        else {
            const img = document.createElement('img')
            const photoAttributes = {
                class: 'photos-items',
                src: item.url,
                title: `${data.user.fullName} | ${data.user.username} | ${item.id} | ${data.date}`,
            }
            Object.keys(photoAttributes).forEach(key => {
                img.setAttribute(key, photoAttributes[key])
            })
            PHOTOS_CONTAINER.appendChild(img)
            img.addEventListener('click', () => {
                saveMedia(img, `${img.title.replaceAll(' | ', '_').replaceAll(data.user.fullName, '').substring(1)}.jpeg`)
            })
        }
    })
    setDownloadState('success', PHOTOS_CONTAINER, option)
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
        </div>`
    const BUTTON = `<button class="download-button">Download</button>`
    const DISPLAY_NODE = new DOMParser().parseFromString(DISPLAY_CONTAINER, 'text/html').body.firstElementChild
    const BUTTON_NODE = new DOMParser().parseFromString(BUTTON, 'text/html').body.firstElementChild
    document.body.appendChild(DISPLAY_NODE)
    document.body.appendChild(BUTTON_NODE)
}
function handleEvents() {
    const ESC_BUTTON = document.querySelector('.esc-button')
    const DISPLAY_CONTAINER = document.querySelector('.display-container')
    const DOWNLOAD_BUTTON = document.querySelector('.download-button')
    const IGNORE_FOCUS_ELEMENTS = ['INPUT', 'TEXTAREA']
    const ESC_EVENT_KEYS = ['Escape', 'C', 'c']
    const DOWNLOAD_EVENT_KEYS = ['D', 'd']
    DOWNLOAD_BUTTON.addEventListener('click', handleDownload)
    function setTheme() {
        const isDarkMode = document.documentElement.classList.contains('_aa4d')
        if (isDarkMode) {
            DISPLAY_CONTAINER.classList.add('dark')
            DISPLAY_CONTAINER.firstElementChild.classList.add('dark')
        }
        else {
            DISPLAY_CONTAINER.classList.remove('dark')
            DISPLAY_CONTAINER.firstElementChild.classList.remove('dark')
        }
    }
    function pauseVideo() {
        if (DISPLAY_CONTAINER.classList.contains('hide')) {
            DISPLAY_CONTAINER.querySelectorAll('video').forEach(video => {
                video.pause()
            })
        }
    }
    const handleTheme = new MutationObserver(setTheme)
    const handleVideo = new MutationObserver(pauseVideo)
    handleTheme.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    })
    handleVideo.observe(DISPLAY_CONTAINER, {
        attributes: true,
        attributeFilter: ['class']
    })
    ESC_BUTTON.addEventListener('click', () => {
        DISPLAY_CONTAINER.classList.add('hide')
    })
    window.addEventListener('keydown', (e) => {
        if (!IGNORE_FOCUS_ELEMENTS.includes(document.activeElement.tagName)) {
            if (DOWNLOAD_EVENT_KEYS.includes(e.key)) DOWNLOAD_BUTTON.click()
            if (ESC_EVENT_KEYS.includes(e.key)) ESC_BUTTON.click()
        }
    })
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            DISPLAY_CONTAINER.querySelectorAll('video').forEach(video => {
                video.pause()
            })
        }
    })
    window.addEventListener('online', () => {
        DISPLAY_CONTAINER.querySelectorAll('img , video').forEach(media => {
            media.src = media.src
        })
    })
    setTheme()
}
function main(profileID = '51963237586') {
    document.querySelectorAll('.display-container, .download-button').forEach(node => {
        node.remove()
    })
    initUI()
    setDefaultShortcode(profileID)
    handleEvents()
}
main()