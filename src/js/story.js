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
    const options = getAuthOptions()
    const data = {
        date: '',
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
    data.date = json.items[0]['taken_at']
    json.items.forEach((item) => {
        if (item['media_type'] === 1) {
            const media = {
                url: item['image_versions2'].candidates[0]['url'],
                isVideo: false,
                id: item.id.split('_')[0]
            }
            data.media.push(media)
        }
        else {
            const media = {
                url: item['video_versions'][0].url,
                isVideo: true,
                id: item.id.split('_')[0]
            }
            data.media.push(media)
        }
    })
    return data
}