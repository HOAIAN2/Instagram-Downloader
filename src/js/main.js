let postShortcode = ''
let lastShortcode = ''
const PROFILE_HASH = '69cba40317214236af40e7efa697781d'
const POST_HASH = '9f8827793ef34641b2fb195d4d41151c'
function getShortcode() {
    const DOWNLOADABLE_PAGE = ['p', 'reel', 'tv']
    const currentPage = window.location.pathname
    const pagePath = currentPage.split('/')
    if (DOWNLOADABLE_PAGE.includes(pagePath[1])) {
        postShortcode = pagePath[2]
    }
    return postShortcode
}
async function setDefaultShortcode() {
    const PROFILE_ID = '51963237586'
    const PROFILE_URL = `https://www.instagram.com/graphql/query/?query_hash=${PROFILE_HASH}&variables={"id":"${PROFILE_ID}","first":1}`
    const respone = await fetch(PROFILE_URL).catch(error => {
        console.log(error)
        return null
    })
    if (!respone) return
    const json = await respone.json()
    postShortcode = json.data.user.edge_owner_to_timeline_media.edges[0].node.shortcode
}
async function getPostPhotos(postURL) {
    const respone = await fetch(postURL).catch(error => {
        console.log(error)
        return null
    })
    if (!respone) return
    const json = await respone.json()
    return json
}
async function downloadPhoto(photoURL, fileName) {
    const respone = await fetch(photoURL.src).catch(error => {
        console.log(error)
        return null
    })
    if (!respone) return
    const blob = await respone.blob()
    const downloadURL = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadURL
    a.download = fileName
    a.click()
    URL.revokeObjectURL(a.href)
}
function downloadState(state = 'Ready', PHOTOS_CONTAINER) {
    const DOWNLOAD_BUTTON = document.querySelector('#Download-Button')
    switch (state) {
        case 'Ready':
            DOWNLOAD_BUTTON.className = 'Downloading'
            DOWNLOAD_BUTTON.textContent = 'Loading...'
            DOWNLOAD_BUTTON.disabled = true
            PHOTOS_CONTAINER.querySelectorAll('img , video').forEach(item => {
                item.remove()
            })
            break
        case 'Fail':
            DOWNLOAD_BUTTON.className = 'Download'
            DOWNLOAD_BUTTON.textContent = 'Download'
            DOWNLOAD_BUTTON.disabled = false
            break
        case 'Success':
            lastShortcode = postShortcode
            DOWNLOAD_BUTTON.className = 'Download'
            DOWNLOAD_BUTTON.textContent = 'Download'
            DOWNLOAD_BUTTON.disabled = false
            break
    }
}
async function downloadPostPhotos() {
    postShortcode = getShortcode()
    const DISPLAY_CONTAINER = document.querySelector('#Display-Container')
    const PHOTOS_CONTAINER = document.querySelector('#Photos-Container')
    const postURL = `https://www.instagram.com/graphql/query/?query_hash=${POST_HASH}&variables={"shortcode":"${postShortcode}"}`
    DISPLAY_CONTAINER.className = 'Show'
    if (postShortcode === lastShortcode) return
    downloadState('Ready', PHOTOS_CONTAINER)
    const jsonRespone = await getPostPhotos(postURL)
    if (!jsonRespone) {
        downloadState('Fail')
        return
    }
    if ('edge_sidecar_to_children' in jsonRespone.data.shortcode_media) {
        const photosArray = jsonRespone.data.shortcode_media.edge_sidecar_to_children.edges
        const photosArrayLength = photosArray.length
        for (let i = 0; i < photosArrayLength; i++) {
            if (photosArray[i].node.is_video == true) {
                const video = document.createElement('video')
                const videoAttributes = {
                    class: 'Photos-Items',
                    id: `${postShortcode}_${i}`,
                    src: photosArray[i].node.video_url,
                    title: `${jsonRespone.data.shortcode_media.owner.full_name} | ${jsonRespone.data.shortcode_media.owner.username} | ${postShortcode}_${i}`,
                    controls: ''
                }
                Object.keys(videoAttributes).forEach(key => {
                    video.setAttribute(key, videoAttributes[key])
                })
                PHOTOS_CONTAINER.appendChild(video)
                video.addEventListener('click', () => {
                    downloadPhoto(video, `${postShortcode}_${i}.mp4`)
                })
            }
            else {
                const img = document.createElement('img')
                const photoAttributes = {
                    class: 'Photos-Items',
                    id: `${postShortcode}_${i}`,
                    src: photosArray[i].node.display_url,
                    title: `${jsonRespone.data.shortcode_media.owner.full_name} | ${jsonRespone.data.shortcode_media.owner.username} | ${postShortcode}_${i}`
                }
                Object.keys(photoAttributes).forEach(key => {
                    img.setAttribute(key, photoAttributes[key])
                })
                PHOTOS_CONTAINER.appendChild(img)
                img.addEventListener('click', () => {
                    downloadPhoto(img, `${postShortcode}_${i}.jpeg`)
                })
            }
        }
    }
    else {
        const photo = jsonRespone.data.shortcode_media
        if (photo.is_video == true) {
            const video = document.createElement('video')
            const videoAttributes = {
                class: 'Photos-Items',
                id: `${postShortcode}`,
                src: photo.video_url,
                title: `${jsonRespone.data.shortcode_media.owner.full_name} | ${jsonRespone.data.shortcode_media.owner.username} | ${postShortcode}`,
                controls: ''
            }
            Object.keys(videoAttributes).forEach(key => {
                video.setAttribute(key, videoAttributes[key])
            })
            PHOTOS_CONTAINER.appendChild(video)
            video.addEventListener('click', () => {
                downloadPhoto(video, `${postShortcode}.mp4`)
            })
        }
        else {
            const img = document.createElement('img')
            const photoAttributes = {
                class: 'Photos-Items',
                id: `${postShortcode}`,
                src: photo.display_url,
                title: `${jsonRespone.data.shortcode_media.owner.full_name} | ${jsonRespone.data.shortcode_media.owner.username} | ${postShortcode}`
            }
            Object.keys(photoAttributes).forEach(key => {
                img.setAttribute(key, photoAttributes[key])
            })
            PHOTOS_CONTAINER.appendChild(img)
            img.addEventListener('click', () => {
                downloadPhoto(img, `${postShortcode}.jpeg`)
            })
        }
    }
    downloadState('Success')
}
function initUI() {
    const DISPLAY_CONTAINER =
        `<div class="Hide" id="Display-Container">
            <div id="Title-Container">
                <span>Photos</span>
                <span id="ESC-Button">&times</span>
            </div>
            <div id="Photos-Container"></div>
        </div>`
    const BUTTON = `<button class="Download" id="Download-Button">Download</button>`
    const DISPLAY_NODE = new DOMParser().parseFromString(DISPLAY_CONTAINER, 'text/html').body.firstElementChild
    const BUTTON_NODE = new DOMParser().parseFromString(BUTTON, 'text/html').body.firstElementChild
    document.body.appendChild(DISPLAY_NODE)
    document.body.appendChild(BUTTON_NODE)
}
function handleEvents() {
    const ESC_BUTTON = document.querySelector('#ESC-Button')
    const DISPLAY_DIV = document.querySelector('#Display-Container')
    const DOWNLOAD_BUTTON = document.querySelector('#Download-Button')
    const IGNORE_FOCUS_ELEMENTS = ['INPUT', 'TEXTAREA']
    const ESC_EVENT_KEYS = ['Escape', 'C', 'c']
    const DOWNLOAD_EVENT_KEYS = ['D', 'd']
    DOWNLOAD_BUTTON.addEventListener('click', downloadPostPhotos)
    ESC_BUTTON.addEventListener('click', () => {
        DISPLAY_DIV.className = 'Hide'
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