let postShortcode = ''
let lastShortcode = ''
let username = ''
let lastUsername = ''
const PROFILE_HASH = '69cba40317214236af40e7efa697781d'
const POST_HASH = '9f8827793ef34641b2fb195d4d41151c'
async function downloadPhoto(photo, fileName) {
    const a = document.createElement('a')
    a.download = fileName
    try {
        const respone = await fetch(photo.src)
        const blob = await respone.blob()
        a.href = URL.createObjectURL(blob)
        a.click()
        URL.revokeObjectURL(a.href)
    } catch (error) {
        console.log(error)
    }
}
function shouldDownload() {
    if (window.location.pathname === '/' && lastUsername !== '') return 'none'
    if (username !== lastUsername) return 'stories'
    if (postShortcode !== lastShortcode) return 'post'
    if (lastShortcode === '' && lastUsername) return 'post'
    return 'none'
}
async function setDefaultShortcode(PROFILE_ID = '51963237586') {
    const PROFILE_URL = `https://www.instagram.com/graphql/query/?query_hash=${PROFILE_HASH}&variables=${encodeURIComponent(`{"id":"${PROFILE_ID}","first":1}`)}`
    try {
        const respone = await fetch(PROFILE_URL)
        const json = await respone.json()
        postShortcode = json.data.user.edge_owner_to_timeline_media.edges[0].node.shortcode
    } catch (error) {
        console.log(error)
    }
}
function downloadState(state = 'ready', PHOTOS_CONTAINER, option = '') {
    const DOWNLOAD_BUTTON = document.querySelector('#download-button')
    function resetState() {
        DOWNLOAD_BUTTON.className = 'download'
        DOWNLOAD_BUTTON.textContent = 'Download'
        DOWNLOAD_BUTTON.disabled = false
    }
    switch (state) {
        case 'ready':
            DOWNLOAD_BUTTON.className = 'downloading'
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
            if (option === 'post') lastShortcode = postShortcode
            else lastUsername = username
            const photosArray = PHOTOS_CONTAINER.querySelectorAll('img , video')
            const totalPhotos = photosArray.length
            let loadedPhotos = 0
            photosArray.forEach(photo => {
                if (photo.tagName === 'IMG') {
                    photo.addEventListener('load', () => {
                        loadedPhotos++
                        if (loadedPhotos === totalPhotos) resetState()
                    })
                }
                else {
                    photo.addEventListener('loadeddata', () => {
                        loadedPhotos++
                        if (loadedPhotos === totalPhotos) resetState()
                    })
                }
            })
            break
    }
}
async function handleDownload() {
    postShortcode = getShortcode()
    username = getUsername()
    let jsonRespone = null
    let displayTitle = ''
    const DISPLAY_CONTAINER = document.querySelector('#display-container')
    const PHOTOS_CONTAINER = document.querySelector('#photos-container')
    DISPLAY_CONTAINER.className = 'Show'
    const option = shouldDownload()
    switch (option) {
        case 'none': return
        case 'post':
            downloadState('ready', PHOTOS_CONTAINER)
            jsonRespone = await downloadPostPhotos()
            displayTitle = postShortcode
            break
        case 'stories':
            downloadState('ready', PHOTOS_CONTAINER)
            jsonRespone = await downloadStoryPhotos()
            displayTitle = `${username}-latest-stories`
            break
        default: return
    }
    if (!jsonRespone) {
        downloadState('fail')
        return
    }
    jsonRespone.media.forEach((item, index) => {
        if (item.isVideo === true) {
            const video = document.createElement('video')
            const videoAttributes = {
                class: 'photos-items',
                id: `${displayTitle}_${index}`,
                src: item.url,
                title: `${jsonRespone.user.fullName} | ${jsonRespone.user.username} | ${displayTitle}_${index}`,
                controls: ''
            }
            Object.keys(videoAttributes).forEach(key => {
                video.setAttribute(key, videoAttributes[key])
            })
            PHOTOS_CONTAINER.appendChild(video)
            video.addEventListener('click', () => {
                downloadPhoto(video, `${displayTitle}_${index}`)
            })
        }
        else {
            const img = document.createElement('img')
            const photoAttributes = {
                class: 'photos-items',
                id: `${displayTitle}_${index}`,
                src: item.url,
                title: `${jsonRespone.user.fullName} | ${jsonRespone.user.username} | ${displayTitle}_${index}`,
            }
            Object.keys(photoAttributes).forEach(key => {
                img.setAttribute(key, photoAttributes[key])
            })
            PHOTOS_CONTAINER.appendChild(img)
            img.addEventListener('click', () => {
                downloadPhoto(img, `${displayTitle}_${index}.jpeg`)
            })
        }
    })
    downloadState('success', PHOTOS_CONTAINER, option)
}
function initUI() {
    let isDarkmode = false
    if (window.location.search.includes('theme=dark')) isDarkmode = true
    const DISPLAY_CONTAINER =
        `<div darkmode="${isDarkmode}" class="hide" id="display-container">
            <div darkmode="${isDarkmode}" id="title-container">
                <span title="Double click to change Theme">Photos</span>
                <span id="esc-button">&times</span>
            </div>
            <div id="photos-container"></div>
        </div>`
    const BUTTON = `<button class="download" id="download-button">Download</button>`
    const DISPLAY_NODE = new DOMParser().parseFromString(DISPLAY_CONTAINER, 'text/html').body.firstElementChild
    const BUTTON_NODE = new DOMParser().parseFromString(BUTTON, 'text/html').body.firstElementChild
    document.body.appendChild(DISPLAY_NODE)
    document.body.appendChild(BUTTON_NODE)
}
function handleEvents() {
    const ESC_BUTTON = document.querySelector('#esc-button')
    const DISPLAY_CONTAINER = document.querySelector('#display-container')
    const DOWNLOAD_BUTTON = document.querySelector('#download-button')
    const TOGGLE_BUTTON = DISPLAY_CONTAINER.querySelector('span')
    const IGNORE_FOCUS_ELEMENTS = ['INPUT', 'TEXTAREA']
    const ESC_EVENT_KEYS = ['Escape', 'C', 'c']
    const DOWNLOAD_EVENT_KEYS = ['D', 'd']
    DOWNLOAD_BUTTON.addEventListener('click', handleDownload)
    TOGGLE_BUTTON.addEventListener('dblclick', () => {
        const currentSearch = window.location.search.slice(1).split('&')
        if (!currentSearch.includes('theme=dark')) {
            if (currentSearch.includes('')) currentSearch[0] = 'theme=dark'
            else {
                currentSearch.push('theme=dark')
            }
            window.location.search = currentSearch.join('&')
        }
        else {
            currentSearch.splice(currentSearch.indexOf('theme=dark'), 1)
            window.location.search = currentSearch.join('&')
        }
    })
    ESC_BUTTON.addEventListener('click', () => {
        DISPLAY_CONTAINER.className = 'hide'
    })
    window.addEventListener('keydown', (e) => {
        if (!IGNORE_FOCUS_ELEMENTS.includes(document.activeElement.tagName)) {
            if (DOWNLOAD_EVENT_KEYS.includes(e.key)) DOWNLOAD_BUTTON.click()
            if (ESC_EVENT_KEYS.includes(e.key)) ESC_BUTTON.click()
        }
    })
}
function main() {
    initUI()
    setDefaultShortcode()
    handleEvents()
}
main()