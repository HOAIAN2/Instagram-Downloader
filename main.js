const PROFILE_ID = '51963237586'
let postShortcode
let lastShortcode
const PROFILE_HASH = '69cba40317214236af40e7efa697781d'
const POST_HASH = '9f8827793ef34641b2fb195d4d41151c'
const PROFILE_URL = `https://www.instagram.com/graphql/query/?query_hash=${PROFILE_HASH}&variables={"id":"${PROFILE_ID}","first":1}`
function getShortcode() {
    let currentPage = window.location.pathname
    if (currentPage.startsWith('/p/') || currentPage.startsWith('/reel/') || currentPage.startsWith('/tv/')) {
        postShortcode = currentPage.split('/')[2]
    }
    return postShortcode
}
async function fetchFirstPost(PROFILE_URL) {
    const respone = await fetch(PROFILE_URL).catch(error => {
        console.error(error)
        return null
    })
    if (!respone) return null
    const json = await respone.json()
    postShortcode = json.data.user.edge_owner_to_timeline_media.edges[0].node.shortcode
}
async function fetchPostPhotos(postURL) {
    const respone = await fetch(postURL).catch(error => {
        console.error(error)
        return null
    })
    if (!respone) return null
    const json = await respone.json()
    return json
}
async function fetchPhotos(photoURL) {
    const respone = await fetch(photoURL).catch(error => {
        console.error(error)
        return null
    })
    if (!respone) return null
    const blob = await respone.blob()
    const downloadURL = URL.createObjectURL(blob)
    return downloadURL
}
async function downloadPostPhotos() {
    postShortcode = getShortcode()
    const DISPLAY_DIV = document.querySelector('#Display-Container')
    const PHOTOS_DIV = document.querySelector('#Photos-Container')
    const DOWNLOAD_BUTTON = document.querySelector('#Download-Button')
    const postURL = `https://www.instagram.com/graphql/query/?query_hash=${POST_HASH}&variables={"shortcode":"${postShortcode}"}`
    DISPLAY_DIV.className = 'Show'
    if (postShortcode == lastShortcode) return
    DOWNLOAD_BUTTON.className = 'Downloading'
    DOWNLOAD_BUTTON.textContent = 'Loading...'
    DOWNLOAD_BUTTON.disabled = true
    PHOTOS_DIV.querySelectorAll('a').forEach(item => {
        item.remove()
    })
    const jsonRespone = await fetchPostPhotos(postURL)
    if (!jsonRespone) {
        DOWNLOAD_BUTTON.className = 'Download'
        DOWNLOAD_BUTTON.textContent = 'Download'
        DOWNLOAD_BUTTON.disabled = false
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
                const a = document.createElement('a')
                a.href = await fetchPhotos(photosArray[i].node.video_url)
                a.download = `${postShortcode}_${i}.mp4`
                PHOTOS_DIV.appendChild(a)
                a.appendChild(video)
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
                const a = document.createElement('a')
                a.href = await fetchPhotos(photosArray[i].node.display_url)
                a.download = `${postShortcode}_${i}.jpeg`
                PHOTOS_DIV.appendChild(a)
                a.appendChild(img)
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
            const a = document.createElement('a')
            a.href = await fetchPhotos(photo.video_url)
            a.download = `${postShortcode}.mp4`
            PHOTOS_DIV.appendChild(a)
            a.appendChild(video)
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
            const a = document.createElement('a')
            a.href = await fetchPhotos(photo.display_url)
            a.download = `${postShortcode}.jpeg`
            PHOTOS_DIV.appendChild(a)
            a.appendChild(img)
        }
    }
    lastShortcode = postShortcode
    DOWNLOAD_BUTTON.className = 'Download'
    DOWNLOAD_BUTTON.textContent = 'Download'
    DOWNLOAD_BUTTON.disabled = false
}
function initUI() {
    const DIV =
        `<div class="Hide" id="Display-Container">
        <div id="Title-Container">
            <span>Photos</span>
            <span id="ESC-Button">&times</span>
        </div>
        <div id="Photos-Container"></div>
    </div>`
    const BUTTON = `<button class="Download" id="Download-Button">Download</button>`
    const DIV_NODE = new DOMParser().parseFromString(DIV, "text/html").body.firstElementChild;
    const BUTTON_NODE = new DOMParser().parseFromString(BUTTON, "text/html").body.firstElementChild;
    document.body.appendChild(DIV_NODE)
    document.body.appendChild(BUTTON_NODE)
}
function main() {
    initUI()
    fetchFirstPost(PROFILE_URL)
    const ESC_BUTTON = document.querySelector('#ESC-Button')
    const DISPLAY_DIV = document.querySelector('#Display-Container')
    const DOWNLOAD_BUTTON = document.querySelector('#Download-Button')
    DOWNLOAD_BUTTON.addEventListener('click', downloadPostPhotos)
    ESC_BUTTON.addEventListener('click', () => {
        DISPLAY_DIV.className = 'Hide'
    })
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') ESC_BUTTON.click()
    })
}
main()