function setCurrentUsername() {
    const DOWNLOADABLE_PAGE = ['stories']
    const currentPage = window.location.pathname.split('/')
    if (DOWNLOADABLE_PAGE.includes(currentPage[1]) && currentPage[2] !== 'highlights') appLog.current.username = currentPage[2]
    return appLog.current.username
}
function setCurrentHightlightsID() {
    const currentPage = window.location.pathname.split('/')
    if (currentPage[1] === 'stories' && currentPage[2] === 'highlights') appLog.current.highlights = currentPage[3]
    return appLog.current.highlights
}
async function getUserID(options) {
    try {
        const respone = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${appLog.current.username}`, options)
        const json = await respone.json()
        return json.data.user['id']
    } catch (error) {
        console.log(error)
        return ''
    }
}
async function getStoryPhotos(userID = '51963237586', options) {
    try {
        const respone = await fetch(`https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=${userID}`, options)
        const json = await respone.json()
        return json.reels[userID]
    } catch (error) {
        console.log(error)
        return null
    }
}
async function getHighlightStory(options) {
    try {
        const respone = await fetch(`https://www.instagram.com/api/v1/feed/reels_media/?reel_ids=highlight:${appLog.current.highlights}`, options)
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
            'x-asbd-id': '198387', // Unkown
            'x-csrftoken': csrftoken, // Cookie "csrftoken" can delete
            'x-ig-app-id': '936619743392459', // Unkown
            'x-ig-www-claim': claim, // Section "www-claim-v2"
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