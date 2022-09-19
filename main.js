const Profile_ID = '51963237586'
let Postshortcode
let Lastshortcode
const Profile_hash = '69cba40317214236af40e7efa697781d'
const Post_hash = '9f8827793ef34641b2fb195d4d41151c'
const Profile_URL = `https://www.instagram.com/graphql/query/?query_hash=${Profile_hash}&variables={"id":"${Profile_ID}","first":1}`
function GetShortcode() {
    let Current_page = window.location.pathname
    if (Current_page.startsWith('/p/') || Current_page.startsWith('/reel/') || Current_page.startsWith('/tv/')) {
        Postshortcode = Current_page.split('/')[2]
    }
    return Postshortcode
}
async function Fetch_First_Post(Profile_URL) {
    const respone = await fetch(Profile_URL)
    const Json = await respone.json()
    Postshortcode = Json.data.user.edge_owner_to_timeline_media.edges[0].node.shortcode
}
async function Fetch_Post_Photos(Post_URL) {
    const respone = await fetch(Post_URL).catch(error => {
        return null
    })
    if (!respone) return 'Disconnect'
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
    Postshortcode = GetShortcode()
    const Display_Div = document.querySelector('#Download-Display')
    const Photos_Div = document.querySelector('#Photos-Display')
    const Download_Button = document.querySelector('#Download-Button')
    const Post_URL = `https://www.instagram.com/graphql/query/?query_hash=${Post_hash}&variables={"shortcode":"${Postshortcode}"}`
    Display_Div.className = 'Show'
    if (Postshortcode == Lastshortcode) return
    Download_Button.className = 'Downloading'
    Download_Button.textContent = 'Loading...'
    Download_Button.disabled = true
    Photos_Div.innerHTML = ''
    const JsonRespone = await Fetch_Post_Photos(Post_URL)
    if (JsonRespone == 'Disconnect') {
        Lastshortcode = Postshortcode
        Download_Button.textContent = 'Download'
        Download_Button.className = 'Download'
        Download_Button.disabled = false
        return
    }
    if ('edge_sidecar_to_children' in JsonRespone.data.shortcode_media) {
        const Photos_Array = JsonRespone.data.shortcode_media.edge_sidecar_to_children.edges
        const Photo_Array_Length = Photos_Array.length
        for (let i = 0; i < Photo_Array_Length; i++) {
            if (Photos_Array[i].node.is_video == true) {
                const video = document.createElement('video')
                video.className = 'DisplayToDownload'
                video.id = `${Postshortcode}_${i}`
                video.src = Photos_Array[i].node.video_url
                video.title = `${JsonRespone.data.shortcode_media.owner.username} | ${Postshortcode}_${i}`
                video.setAttribute('controls', '')
                const a = document.createElement('a')
                Photos_Div.appendChild(a)
                a.appendChild(video)
                a.href = video.src
                a.download = `${Postshortcode}_${i}.mp4`
            }
            else {
                const img = document.createElement('img')
                img.className = 'DisplayToDownload'
                img.id = `${Postshortcode}_${i}`
                img.src = Photos_Array[i].node.display_url
                img.title = `${JsonRespone.data.shortcode_media.owner.username} | ${Postshortcode}_${i}`
                const a = document.createElement('a')
                Photos_Div.appendChild(a)
                a.appendChild(img)
                a.href = await Fetch_Photos(Photos_Array[i].node.display_url)
                a.download = `${Postshortcode}_${i}.jpeg`
            }
        }
    }
    else {
        const Photo = JsonRespone.data.shortcode_media
        if (Photo.is_video == true) {
            const video = document.createElement('video')
            video.className = 'DisplayToDownload'
            video.id = `${Postshortcode}`
            video.src = Photo.video_url
            video.title = `${JsonRespone.data.shortcode_media.owner.username} | ${Postshortcode}`
            video.setAttribute('controls', '')
            const a = document.createElement('a')
            Photos_Div.appendChild(a)
            a.appendChild(video)
            a.href = video.src
            a.download = `${Postshortcode}.mp4`
        }
        else {
            const img = document.createElement('img')
            img.className = 'DisplayToDownload'
            img.id = `${Postshortcode}`
            img.src = Photo.display_url
            img.title = `${JsonRespone.data.shortcode_media.owner.username} | ${Postshortcode}`
            const a = document.createElement('a')
            a.appendChild(img)
            a.href = await Fetch_Photos(Photo.display_url)
            a.download = `${Postshortcode}.jpeg`
            Photos_Div.appendChild(a)
        }
    }
    Lastshortcode = Postshortcode
    Download_Button.textContent = 'Download'
    Download_Button.className = 'Download'
    Download_Button.disabled = false
}
function UI_Init() {
    const div = document.createElement('div')
    const div1 = document.createElement('div')
    const div2 = document.createElement('div')
    const title = document.createElement('span')
    const esc = document.createElement('span')
    const button = document.createElement('button')
    div.className = 'Hide'
    div.id = 'Download-Display'
    div1.id = 'Title-Div'
    div2.id = 'Photos-Display'
    title.textContent = 'Photos'
    esc.id = 'ESC-Button'
    esc.textContent = '×'
    button.className = 'Download'
    button.id = 'Download-Button'
    button.textContent = 'Download'
    document.body.appendChild(div)
    div.appendChild(div1)
    div1.appendChild(title)
    div1.appendChild(esc)
    div.appendChild(div2)
    document.body.appendChild(button)
}
UI_Init()
Fetch_First_Post(Profile_URL)
const ESC_Button = document.querySelector('#ESC-Button')
const Display_Div = document.querySelector('#Download-Display')
const Download_Button = document.querySelector('#Download-Button')
const Photos_Div = document.querySelector('#Photos-Display')
Download_Button.addEventListener('click', Post_Photos_Downloader)
ESC_Button.addEventListener('click', () => {
    Display_Div.className = 'Hide'
})
