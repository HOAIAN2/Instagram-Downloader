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
        console.log(error)
        return null
    })
    if (!respone) return null
    const json = await respone.json()
    postShortcode = json.data.user.edge_owner_to_timeline_media.edges[0].node.shortcode
}
async function fetchPostPhotos(postURL) {
    const respone = await fetch(postURL).catch(error => {
        console.log(error)
        return null
    })
    if (!respone) return null
    const json = await respone.json()
    return json
}
async function fetchPhotos(photoURL) {
    const respone = await fetch(photoURL).catch(error => {
        console.log(error)
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
        DOWNLOAD_BUTTON.textContent = 'Download'
        DOWNLOAD_BUTTON.className = 'Download'
        DOWNLOAD_BUTTON.disabled = false
        return
    }
    if ('edge_sidecar_to_children' in jsonRespone.data.shortcode_media) {
        const photosArray = jsonRespone.data.shortcode_media.edge_sidecar_to_children.edges
        const photosArrayLength = photosArray.length
        for (let i = 0; i < photosArrayLength; i++) {
            if (photosArray[i].node.is_video == true) {
                const video = document.createElement('video')
                video.className = 'Photos-Items'
                video.id = `${postShortcode}_${i}`
                video.src = photosArray[i].node.video_url
                video.title = `${jsonRespone.data.shortcode_media.owner.full_name} | ${jsonRespone.data.shortcode_media.owner.username} | ${postShortcode}_${i}`
                video.setAttribute('controls', '')
                const a = document.createElement('a')
                PHOTOS_DIV.appendChild(a)
                a.appendChild(video)
                a.href = await fetchPhotos(photosArray[i].node.video_url)
                a.download = `${postShortcode}_${i}.mp4`
            }
            else {
                const img = document.createElement('img')
                img.className = 'Photos-Items'
                img.id = `${postShortcode}_${i}`
                img.src = photosArray[i].node.display_url
                img.title = `${jsonRespone.data.shortcode_media.owner.full_name} | ${jsonRespone.data.shortcode_media.owner.username} | ${postShortcode}_${i}`
                const a = document.createElement('a')
                PHOTOS_DIV.appendChild(a)
                a.appendChild(img)
                a.href = await fetchPhotos(photosArray[i].node.display_url)
                a.download = `${postShortcode}_${i}.jpeg`
            }
        }
    }
    else {
        const photo = jsonRespone.data.shortcode_media
        if (photo.is_video == true) {
            const video = document.createElement('video')
            video.className = 'Photos-Items'
            video.id = `${postShortcode}`
            video.src = photo.video_url
            video.title = `${jsonRespone.data.shortcode_media.owner.full_name} | ${jsonRespone.data.shortcode_media.owner.username} | ${postShortcode}`
            video.setAttribute('controls', '')
            const a = document.createElement('a')
            PHOTOS_DIV.appendChild(a)
            a.appendChild(video)
            a.href = await fetchPhotos(photo.video_url)
            a.download = `${postShortcode}.mp4`
        }
        else {
            const img = document.createElement('img')
            img.className = 'Photos-Items'
            img.id = `${postShortcode}`
            img.src = photo.display_url
            img.title = `${jsonRespone.data.shortcode_media.owner.full_name} | ${jsonRespone.data.shortcode_media.owner.username} | ${postShortcode}`
            const a = document.createElement('a')
            a.appendChild(img)
            a.href = await fetchPhotos(photo.display_url)
            a.download = `${postShortcode}.jpeg`
            PHOTOS_DIV.appendChild(a)
        }
    }
    lastShortcode = postShortcode
    DOWNLOAD_BUTTON.textContent = 'Download'
    DOWNLOAD_BUTTON.className = 'Download'
    DOWNLOAD_BUTTON.disabled = false
}
function initUI() {
    const DIV = document.createElement('div')
    const DIV_1 = document.createElement('div')
    const DIV_2 = document.createElement('div')
    const TITLE = document.createElement('span')
    const ESC = document.createElement('span')
    const BUTTON = document.createElement('button')
    DIV.className = 'Hide'
    DIV.id = 'Display-Container'
    DIV_1.id = 'Title-Container'
    DIV_2.id = 'Photos-Container'
    TITLE.textContent = 'Photos'
    ESC.id = 'ESC-Button'
    ESC.textContent = '×'
    BUTTON.className = 'Download'
    BUTTON.id = 'Download-Button'
    BUTTON.textContent = 'Download'
    document.body.appendChild(DIV)
    DIV.appendChild(DIV_1)
    DIV_1.appendChild(TITLE)
    DIV_1.appendChild(ESC)
    DIV.appendChild(DIV_2)
    document.body.appendChild(BUTTON)
}
initUI()
fetchFirstPost(PROFILE_URL)
const ESC_BUTTON = document.querySelector('#ESC-Button')
const DISPLAY_DIV = document.querySelector('#Display-Container')
const DOWNLOAD_BUTTON = document.querySelector('#Download-Button')
const PHOTOS_DIV = document.querySelector('#Photos-Container')
DOWNLOAD_BUTTON.addEventListener('click', downloadPostPhotos)
ESC_BUTTON.addEventListener('click', () => {
    DISPLAY_DIV.className = 'Hide'
})