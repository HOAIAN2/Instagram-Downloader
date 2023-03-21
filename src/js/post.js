function setCurrentShortcode() {
    const postRegex = /\/(p|tv|reel|reels)\/(.*?)\//
    const page = window.location.pathname.match(postRegex)
    if (page) appLog.current.shortcode = page[2]
}
async function getPostID() {
    const apiURL = new URL('/graphql/query/', BASE_URL)
    apiURL.searchParams.set('query_hash', POST_HASH)
    apiURL.searchParams.set('variables', JSON.stringify({
        shortcode: appLog.current.shortcode
    }))
    try {
        const respone = await fetch(apiURL.href)
        const json = await respone.json()
        return json.data['shortcode_media']['id']
    } catch (error) {
        console.log(error)
        return ''
    }
}
async function getPostPhotos(options) {
    const postID = await getPostID()
    const apiURL = new URL(`/api/v1/media/${postID}/info/`, BASE_URL)
    try {
        const respone = await fetch(apiURL.href, options)
        const json = await respone.json()
        return json.items[0]
    } catch (error) {
        console.log(error)
        return null
    }
}
async function downloadPostPhotos() {
    const options = getAuthOptions()
    const data = {
        date: '',
        user: {
            username: '',
            fullName: '',
        },
        media: []
    }
    const json = await getPostPhotos(options)
    if (!json) return null
    data.user.username = json.user['username']
    data.user.fullName = json.user['full_name']
    data.date = json['taken_at']
    if (json['carousel_media']) {
        json['carousel_media'].forEach((item) => {
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
    }
    else {
        if (json['media_type'] === 1) {
            const media = {
                url: json['image_versions2'].candidates[0]['url'],
                isVideo: false,
                id: json.id.split('_')[0]
            }
            data.media.push(media)
        }
        else {
            const media = {
                url: json['video_versions'][0].url,
                isVideo: true,
                id: json.id.split('_')[0]
            }
            data.media.push(media)
        }
    }
    return data
}