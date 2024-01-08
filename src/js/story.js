async function getUserIdFromSearch() {
    const apiURL = new URL('/web/search/topsearch/', BASE_URL)
    apiURL.searchParams.set('query', appState.current.username)
    try {
        const respone = await fetch(apiURL.href)
        const json = await respone.json()
        return json.users[0].user['pk_id']
    } catch (error) {
        console.log(error)
        return ''
    }
}
async function getUserId(options) {
    const apiURL = new URL('/api/v1/users/web_profile_info/', BASE_URL)
    apiURL.searchParams.set('username', appState.current.username)
    try {
        const respone = await fetch(apiURL.href, options)
        const json = await respone.json()
        return json.data.user['id']
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
async function getHighlightStory(highlightsID, options) {
    const apiURL = new URL('/api/v1/feed/reels_media/', BASE_URL)
    apiURL.searchParams.set('reel_ids', `highlight:${highlightsID}`)
    try {
        const respone = await fetch(apiURL.href, options)
        const json = await respone.json()
        return json.reels[`highlight:${highlightsID}`]
    } catch (error) {
        console.log(error)
        return null
    }
}
async function downloadStoryPhotos(type = 'stories') {
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
    if (type === 'highlights') json = await getHighlightStory(appState.current.highlights, options)
    else {
        const userID = await getUserId(options)
        if (!userID) return null
        json = await getStoryPhotos(userID, options)
    }
    if (!json) return null
    data.user.username = json.user['username']
    data.user.fullName = json.user['full_name']
    data.date = json.items[0]['taken_at']
    json.items.forEach((item) => {
        const media = {
            url: item['media_type'] === 1 ? item['image_versions2'].candidates[0]['url'] : item['video_versions'][0].url,
            isVideo: item['media_type'] === 1 ? false : true,
            id: item.id.split('_')[0]
        }
        data.media.push(media)
    })
    return data
}