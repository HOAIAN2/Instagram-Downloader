function setCurrentUsername() {
    const regex = /\/(stories)\/(.*?)\/(\d*?)\//
    const page = window.location.pathname.match(regex)
    if (page && page[2] !== 'highlights') appLog.current.username = page[2]
}
function setCurrentHightlightsID() {
    const regex = /\/(stories)\/(highlights)\/(\d*?)\//
    const page = window.location.pathname.match(regex)
    if (page) appLog.current.highlights = page[3]
}
async function getUserID() {
    const apiURL = new URL('/web/search/topsearch/', BASE_URL)
    apiURL.searchParams.set('query', appLog.current.username)
    try {
        const respone = await fetch(apiURL.href)
        const json = await respone.json()
        return json.users[0].user['pk_id']
    } catch (error) {
        console.log(error)
        return ''
    }
}
async function getStoryPhotos(userID, options) {
    const apiURL = new URL('/api/v1/feed/reels_media/', BASE_URL)
    apiURL.searchParams.set('reel_ids', userID)
    try {
        const respone = await fetch(apiURL.href, options)
        const json = await respone.json()
        return json.reels[userID]
    } catch (error) {
        console.log(error)
        return null
    }
}
async function getHighlightStory(options) {
    const apiURL = new URL('/api/v1/feed/reels_media/', BASE_URL)
    apiURL.searchParams.set('reel_ids', `highlight:${appLog.current.highlights}`)
    try {
        const respone = await fetch(apiURL.href, options)
        const json = await respone.json()
        return json.reels[`highlight:${appLog.current.highlights}`]
    } catch (error) {
        console.log(error)
        return null
    }
}
async function downloadStoryPhotos(type = 1) {
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
    const data = {
        user: {
            username: '',
            fullName: '',
        },
        media: []
    }
    let json = null
    if (type === 2) {
        json = await getHighlightStory(options)
    }
    else {
        const userID = await getUserID()
        if (!userID) return null
        json = await getStoryPhotos(userID, options)
    }
    if (!json) return null
    data.user.username = json.user['username']
    data.user.fullName = json.user['full_name']
    json.items.forEach((item) => {
        if (item['media_type'] === 1) {
            const media = {
                url: item['image_versions2'].candidates[0]['url'],
                isVideo: false
            }
            data.media.push(media)
        }
        else {
            const media = {
                url: item['video_versions'][0].url,
                isVideo: true
            }
            data.media.push(media)
        }
    })
    return data
}