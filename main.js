let Profile_ID = '51963237586'
let Postshortcode = 'CiHCud-pukl'
let Lastshortcode
let current_page = window.location.href
function CutString() {
    current_page = window.location.href
    if (current_page.startsWith("https://www.instagram.com/p/")) {
        Postshortcode = current_page.replace('https://www.instagram.com/p/', '')
        current_page = Postshortcode
        Postshortcode = current_page.replace('/', '')
    }
    return Postshortcode
}
async function Fetch_Post_Photos(Post_URL) {
    const respone = await fetch(Post_URL)
    const Json = await respone.json()
    return Json
}
async function Fetch_Photos(Photo_URL) {
    const respone = await fetch(Photo_URL)
    const Blob = await respone.blob()
    const Download_URL = URL.createObjectURL(Blob)
    return Download_URL
}
async function Post_Photos_Downloader() {
    Postshortcode = CutString()
    const Display_Div = document.querySelector('#Download-Display')
    const Photos_Div = document.querySelector('#Photos-Display')
    const Download_Button = document.querySelector('#Download-Button')
    const ESC = document.querySelector('#ESC-Button')
    ESC.className = "Show"
    Display_Div.className = "Show"
    if(Postshortcode == Lastshortcode) return
    Download_Button.textContent = "Loading..."
    Download_Button.className = "Downloading"
    Download_Button.disabled = true
    Photos_Div.innerHTML = ""
    let Post_URL = `https://www.instagram.com/graphql/query/?query_hash=9f8827793ef34641b2fb195d4d41151c&variables={"shortcode":"${Postshortcode}"}`
    const JsonRespone = await Fetch_Post_Photos(Post_URL)
    if ('edge_sidecar_to_children' in JsonRespone.data.shortcode_media) {
        // Post have Multi Photo
        const Photos_Array = JsonRespone.data.shortcode_media.edge_sidecar_to_children.edges
        const Photo_Array_Length = Photos_Array.length
        for (let i = 0; i < Photo_Array_Length; i++) {
            if (Photos_Array[i].node.is_video == true) {
                const video = document.createElement('video')
                video.className = "DisplayToDownload"
                video.id = `${Postshortcode}_${i}`
                video.src = Photos_Array[i].node.video_url
                video.setAttribute('controls', '')
                video.setAttribute('autoplay', '')
                video.setAttribute('loop', '')
                const a = document.createElement('a')
                Photos_Div.appendChild(a)
                a.appendChild(video)
                a.href = video.src
                a.download = `${Postshortcode}_${i}.mp4`
            }
            else {
                const img = document.createElement('img')
                img.className = "DisplayToDownload"
                img.id = `${Postshortcode}_${i}`
                img.src = Photos_Array[i].node.display_url
                const a = document.createElement('a')
                Photos_Div.appendChild(a)
                a.appendChild(img)
                a.href = await Fetch_Photos(Photos_Array[i].node.display_url)
                a.download = `${Postshortcode}_${i}.jpeg`
            }
        }
    }
    else {
        // Post have 1 Photo
        const Photo = JsonRespone.data.shortcode_media
        if (Photo.is_video == true) {
            const video = document.createElement('video')
            video.className = "DisplayToDownload"
            video.id = `${Postshortcode}`
            video.src = Photo.video_url
            video.setAttribute('controls', '')
            video.setAttribute('autoplay', '')
            video.setAttribute('loop', '')
            const a = document.createElement('a')
            Photos_Div.appendChild(a)
            a.appendChild(video)
            a.href = video.src
            a.download = `${Postshortcode}.mp4`
        }
        else {
            const img = document.createElement('img')
            img.className = "DisplayToDownload"
            img.id = `${Postshortcode}`
            img.src = Photo.display_url
            const a = document.createElement('a')
            a.appendChild(img)
            a.href = await Fetch_Photos(Photo.display_url)
            a.download = `${Postshortcode}.jpeg`
            Photos_Div.appendChild(a)
        }
    }
    Lastshortcode = Postshortcode
    Download_Button.textContent = "Download"
    Download_Button.className = "Download"
    Download_Button.disabled = false
}
async function DownloadPost() {
    await Post_Photos_Downloader()
}
function UI_Init() {
    const div = document.createElement('div')
    const div1 = document.createElement('div')
    const button = document.createElement('button')
    const esc = document.createElement('div')
    const x = document.createElement('div')
    div.id = "Download-Display"
    div.className = "Hide"
    div1.id = "Photos-Display"
    button.id = "Download-Button"
    button.className = "Download"
    button.textContent = "Download"
    esc.id = "ESC-Button"
    esc.className = "Hide"
    x.id = "ESC-Child"
    x.textContent = "×"
    document.body.appendChild(div)
    div.appendChild(div1)
    div.appendChild(esc)
    esc.appendChild(x)
    document.body.appendChild(button)
}
UI_Init()
const ESC_Button = document.querySelector('#ESC-Button')
const Display_Div = document.querySelector('#Download-Display')
const Download_Button = document.querySelector('#Download-Button')
const Photos_Div = document.querySelector('#Photos-Display')
Download_Button.addEventListener('click', DownloadPost)
ESC_Button.addEventListener('click', () => {
    Display_Div.className = "Hide"
})