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
        media.nextElementSibling.classList.remove('check')
        media.nextElementSibling.classList.add('saved')
    } catch (error) {
        console.log(error)
    }
}
async function saveZip() {
    const zip = new JSZip()
    const array = []
    const medias = Array.from(document.querySelectorAll('.overlay.checked')).map(item => item.previousElementSibling)
    const zipFileName = medias[0].title.split(' | ').slice(1, 5).join('_') + '.zip'
    for (let index = 0; index < medias.length; index++) {
        const res = await fetch(medias[index].src)
        const blob = await res.blob()
        const data = {
            title: medias[index].title.split(' | ').slice(1, 5).join('_'),
            data: blob
        }
        if (medias[index].nodeName === 'VIDEO') data.title = `${data.title}.mp4`
        else data.title = `${data.title}.jpeg`
        array.push(data)
    }
    array.forEach(item => {
        zip.file(item.title, item.data, { base64: true })
    })
    zip.generateAsync({ type: 'blob' })
        .then(blob => {
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = zipFileName
            a.click()
            URL.revokeObjectURL(a.href)
            document.querySelectorAll('.overlay.checked').forEach(element => {
                element.classList.remove('checked')
                element.classList.add('saved')
            })
        })
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
            Array.from(PHOTOS_CONTAINER.children).forEach(item => {
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
    const option = shouldDownload()
    const totalItemChecked = Array.from(document.querySelectorAll('.overlay.checked'))
    if (!DISPLAY_CONTAINER.classList.contains('hide') && option === 'none' && totalItemChecked.length !== 0) {
        if (totalItemChecked.length === 1) {
            const media = totalItemChecked[0].previousElementSibling
            if (media.nodeName === 'VIDEO') {
                saveMedia(media, media.title.split(' | ').slice(1, 5).join('_') + '.mp4')
            }
            else {
                saveMedia(media, media.title.split(' | ').slice(1, 5).join('_') + '.jpeg')
            }
        }
        else {
            saveZip()
        }
        return
    }
    DISPLAY_CONTAINER.classList.remove('hide')
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
    const svgTemplate =
        `<svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 709 709">
            <path id="Imported Path"
            fill="currentcolor" stroke="black" stroke-width="1"
            d="M 552.07,233.08
            C 548.07,234.96 501.43,273.35 424.52,338.12
            357.88,394.26 302.86,440.03 302.36,439.78
            301.86,439.66 275.97,413.40 244.96,381.38
            213.83,349.37 186.19,321.74 183.56,319.86
            165.31,307.23 138.55,316.61 131.05,338.12
            129.92,341.62 128.92,346.50 128.80,349.00
            128.80,355.13 131.92,365.00 135.30,369.63
            139.42,375.13 273.35,512.56 278.60,516.68
            285.73,522.18 292.60,524.31 302.23,523.68
            306.86,523.43 312.86,522.18 315.36,520.93
            317.86,519.68 381.38,467.04 456.66,403.89
            587.71,293.73 593.46,288.73 597.46,281.35
            609.84,257.72 593.08,230.08 566.45,230.08
            560.45,230.08 556.70,230.96 552.07,233.08 Z
            M 336.99,2.13
            C 297.10,4.50 259.97,12.50 225.20,26.26
            106.04,73.28 20.88,181.94 4.38,308.23
            -14.38,451.53 55.27,590.46 182.06,662.61
            219.33,683.74 268.47,699.62 314.49,705.37
            330.74,707.50 378.51,707.50 394.51,705.37
            505.30,691.24 598.59,631.72 655.86,538.31
            712.63,445.78 723.51,328.24 684.37,228.33
            638.35,110.41 534.44,26.13 410.89,6.25
            386.76,2.38 358.50,0.75 336.99,2.13 Z
            M 396.39,75.65
            C 455.66,84.90 509.18,111.54 551.32,152.93
            595.46,196.32 622.59,248.34 633.60,310.73
            636.72,328.49 636.72,380.51 633.60,398.27
            628.47,427.65 621.34,450.16 608.96,476.04
            561.95,574.20 463.29,636.47 354.50,636.47
            259.09,636.47 170.44,588.33 117.54,507.68
            108.16,493.30 92.91,462.41 87.66,447.03
            82.90,432.65 78.15,414.27 75.40,398.27
            72.28,380.51 72.28,328.49 75.40,310.73
            82.65,269.85 97.78,231.08 119.29,199.07
            130.92,181.69 138.05,172.94 153.55,157.18
            200.20,109.79 259.47,81.15 326.37,73.90
            341.25,72.28 380.76,73.28 396.39,75.65 Z" />
        </svg>`
    data.media.forEach(item => {
        if (item.isVideo === true) {
            const date = new Date(data.date * 1000).toISOString().split('T')[0]
            const ITEM_TEMPLATE =
                `<div>
                    <video></video>
                    <div class="overlay">
                        ${svgTemplate}
                    </div>
                </div>`
            const itemDOM = new DOMParser().parseFromString(ITEM_TEMPLATE, 'text/html').body.firstElementChild
            const video = itemDOM.querySelector('video')
            const videoAttributes = {
                class: 'photos-items',
                src: item.url,
                title: `${data.user.fullName} | ${data.user.username} | ${item.id} | ${date}`,
                controls: ''
            }
            Object.keys(videoAttributes).forEach(key => {
                video.setAttribute(key, videoAttributes[key])
            })
            PHOTOS_CONTAINER.appendChild(itemDOM)
            video.addEventListener('click', () => {
                saveMedia(video, video.title.split(' | ').slice(1, 5).join('_') + '.mp4')
            })
        }
        else {
            const date = new Date(data.date * 1000).toISOString().split('T')[0]
            const ITEM_TEMPLATE =
                `<div>
                    <img />
                    <div class="overlay">
                        ${svgTemplate}
                    </div>
                </div>`
            const itemDOM = new DOMParser().parseFromString(ITEM_TEMPLATE, 'text/html').body.firstElementChild
            const img = itemDOM.querySelector('img')
            const photoAttributes = {
                class: 'photos-items',
                src: item.url,
                title: `${data.user.fullName} | ${data.user.username} | ${item.id} | ${date}`,
            }
            Object.keys(photoAttributes).forEach(key => {
                img.setAttribute(key, photoAttributes[key])
            })
            PHOTOS_CONTAINER.appendChild(itemDOM)
            img.addEventListener('click', () => {
                saveMedia(img, img.title.split(' | ').slice(1, 5).join('_') + '.jpeg')
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
    const TITLE_CONTAINER = document.querySelector('.title-container')
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
    TITLE_CONTAINER.addEventListener('click', () => {
        const totalItem = Array.from(document.querySelectorAll('.overlay'))
        const totalItemChecked = Array.from(document.querySelectorAll('.overlay.checked'))
        if (totalItemChecked.length !== totalItem.length) totalItem.forEach(item => {
            if (!item.classList.contains('saved')) item.classList.add('checked')
        })
        else totalItem.forEach(item => { item.classList.remove('checked') })
    })
    document.addEventListener('contextmenu', (e) => {
        if (e.target.classList.contains('photos-items')) {
            e.preventDefault()
            const element = e.target.parentNode.querySelector('.overlay')
            if (!element.classList.contains('saved')) element.classList.toggle('checked')
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