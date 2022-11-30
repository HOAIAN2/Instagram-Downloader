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
async function getUserID(options) {
    const userIDAPI = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${appLog.current.username}`
    try {
        const respone = await fetch(userIDAPI, options)
        const json = await respone.json()
        return json.data.user['id']
    } catch (error) {
        console.log(error)
        return ''
    }
}
async function getStoryPhotos(userID = '51963237586', options) {
    const storiesAPI = `https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=${userID}`
    try {
        const respone = await fetch(storiesAPI, options)
        const json = await respone.json()
        return json.reels[userID]
    } catch (error) {
        console.log(error)
        return null
    }
}
async function getHighlightStory(options) {
    const highlightAPI = `https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=highlight:${appLog.current.highlights}`
    try {
        const respone = await fetch(highlightAPI, options)
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
    const jsonRespone = {
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
        const userID = await getUserID(options)
        json = await getStoryPhotos(userID, options)
    }
    if (!json) return null
    jsonRespone.user.username = json.user['username']
    jsonRespone.user.fullName = json.user['full_name']
    json.items.forEach((item) => {
        if (item['media_type'] === 1) {
            const media = {
                url: item['image_versions2'].candidates[0]['url'],
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