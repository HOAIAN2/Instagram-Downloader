let postShortcode = ''
let lastShortcode = ''
const PROFILE_HASH = '69cba40317214236af40e7efa697781d'
const POST_HASH = '9f8827793ef34641b2fb195d4d41151c'
function getShortcode() {
    const DOWNLOADABLE_PAGE = ['p', 'reel', 'tv']
    const currentPage = window.location.pathname.split('/')
    if (DOWNLOADABLE_PAGE.includes(currentPage[1])) {
        postShortcode = currentPage[2]
    }
    return postShortcode
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
async function getUserID(username = '', options) {
    try {
        const respone = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, options)
        const json = await respone.json()
        return json.data.user.id
    } catch (error) {
        console.log(error)
        return ''
    }
}
async function getPostPhotos(postURL) {
    try {
        const respone = await fetch(postURL)
        const json = await respone.json()
        return json.data.shortcode_media
    } catch (error) {
        console.log(error)
    }
}
async function getStoryPhotos(userID = '51963237586', options) {
    try {
        const respone = await fetch(`https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=${userID}`, options)
        const json = await respone.json()
        return json.reels[userID]
    } catch (error) {
        console.log(error)
        return []
    }
}
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
function downloadState(state = 'ready', PHOTOS_CONTAINER) {
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
            lastShortcode = postShortcode
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
async function downloadStoryPhotos(username = '') {
    const csrftoken = document.cookie.split(' ')[2].split('=')[1]
    const claim = sessionStorage.getItem('www-claim-v2')
    const options = {
        headers: {
            "x-asbd-id": "198387", // Unkown
            "x-csrftoken": csrftoken, // Cookie "csrftoken"
            "x-ig-app-id": "936619743392459",
            "x-ig-www-claim": claim, // Section "www-claim-v2"
            "x-instagram-ajax": "1006598911",
            "x-requested-with": "XMLHttpRequest"
        },
        referrer: "https://www.instagram.com/?theme=dark",
        referrerPolicy: "strict-origin-when-cross-origin",
        method: "GET",
        mode: "cors",
        credentials: "include"
    }
    const jsonRespone = {
        user: {
            username: '',
            fullName: '',
        },
        media: []
    }
    const userID = await getUserID(username, options)
    const json = await getStoryPhotos(userID, options)
    jsonRespone.user.username = username
    jsonRespone.user.fullName = json.user["full_name"]
    json.items.forEach((item) => {
        if (item['media_type'] === 1) {
            const media = {
                url: item['image_versions2'].candidates[0].url,
                isVideo: false
            }
            jsonRespone.media.push(media)
        }
        else {
            const media = {
                url: item['video_versions'][0].url,
                isVideo: true
            }
            jsonRespone.media.push(media)
        }
    })
    return jsonRespone
}
async function downloadPostPhotos() {
    const jsonRespone = {
        user: {
            username: '',
            fullName: '',
        },
        media: []
    }
    postShortcode = getShortcode()
    const postURL = `https://www.instagram.com/graphql/query/?query_hash=${POST_HASH}&variables=${encodeURIComponent(`{"shortcode":"${postShortcode}"}`)}`
    const json = await getPostPhotos(postURL)
    jsonRespone.user.username = json.owner['username']
    jsonRespone.user.fullName = json.owner['full_name']
    if (json.hasOwnProperty('edge_sidecar_to_children')) {
        const items = json['edge_sidecar_to_children'].edges
        items.forEach((item) => {
            if (item.node['is_video'] === true) {
                const media = {
                    url: item.node['video_url'],
                    isVideo: true
                }
                jsonRespone.media.push(media)
            }
            else {
                const media = {
                    url: item.node['display_url'],
                    isVideo: false
                }
                jsonRespone.media.push(media)
            }
        })
    }
    else {
        if (json['is_video'] === true) {
            const media = {
                url: json['video_url'],
                isVideo: true
            }
            jsonRespone.media.push(media)
        }
        else {
            const media = {
                url: json['display_url'],
                isVideo: false
            }
            jsonRespone.media.push(media)
        }
    }
    return jsonRespone
}
async function renderPhotos() {
    postShortcode = getShortcode()
    let jsonRespone = null
    const currentPage = window.location.pathname.split('/')
    const DISPLAY_CONTAINER = document.querySelector('#display-container')
    const PHOTOS_CONTAINER = document.querySelector('#photos-container')
    DISPLAY_CONTAINER.className = 'Show'
    downloadState('ready', PHOTOS_CONTAINER)
    if (currentPage[1] == 'stories') jsonRespone = await downloadStoryPhotos(currentPage[2])
    else {
        // if (postShortcode === lastShortcode) return
        jsonRespone = await downloadPostPhotos()
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
                id: `${postShortcode}_${index}`,
                src: item.url,
                title: `${jsonRespone.user.fullName} | ${jsonRespone.user.username} | ${postShortcode}_${index}`,
                controls: ''
            }
            Object.keys(videoAttributes).forEach(key => {
                video.setAttribute(key, videoAttributes[key])
            })
            PHOTOS_CONTAINER.appendChild(video)
            video.addEventListener('click', () => {
                downloadPhoto(video, `${postShortcode}_${index}`)
            })
        }
        else {
            const img = document.createElement('img')
            const photoAttributes = {
                class: 'photos-items',
                id: `${postShortcode}_${index}`,
                src: item.url,
                title: `${jsonRespone.user.fullName} | ${jsonRespone.user.username} | ${postShortcode}_${index}`,
            }
            Object.keys(photoAttributes).forEach(key => {
                img.setAttribute(key, photoAttributes[key])
            })
            PHOTOS_CONTAINER.appendChild(img)
            img.addEventListener('click', () => {
                downloadPhoto(img, `${postShortcode}_${index}.jpeg`)
            })
        }
    })
    downloadState('success', PHOTOS_CONTAINER)
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
    DOWNLOAD_BUTTON.addEventListener('click', renderPhotos)
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