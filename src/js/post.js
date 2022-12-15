function setCurrentShortcode() {
    const postRegex = /\/(p|tv|reel)\/(.*?)\//
    const reelsREgex = /\/(reels)\/(videos)\/(.*?)\//
    const page = window.location.pathname.match(postRegex)
    const page1 = window.location.pathname.match(reelsREgex)
    if (page) appLog.current.shortcode = page[2]
    if (page1) appLog.current.shortcode = page1[3]
}
async function getPostPhotos() {
    const postAPI = `https://www.instagram.com/graphql/query/?query_hash=${POST_HASH}&variables=${encodeURIComponent(`{"shortcode":"${appLog.current.shortcode}"}`)}`
    try {
        const respone = await fetch(postAPI)
        const json = await respone.json()
        return json.data['shortcode_media']
    } catch (error) {
        console.log(error)
        return null
    }
}
async function downloadPostPhotos() {
    const jsonRespone = {
        user: {
            username: '',
            fullName: '',
        },
        media: []
    }
    const json = await getPostPhotos()
    if (!json) return null
    jsonRespone.user.username = json.owner['username']
    jsonRespone.user.fullName = json.owner['full_name']
    if (json.hasOwnProperty('edge_sidecar_to_children')) {
        const items = json['edge_sidecar_to_children']['edges']
        items.forEach((item) => {
            if (item.node['is_video'] === true) {
                const media = {
                    url: item.node['video_url'],
                    isVideo: true
                }
                jsonRespone.media.push(media)
            }
            else {
                const media = {
                    url: item.node['display_url'],
                    isVideo: false
                }
                jsonRespone.media.push(media)
            }
        })
    }
    else {
        if (json['is_video'] === true) {
            const media = {
                url: json['video_url'],
                isVideo: true
            }
            jsonRespone.media.push(media)
        }
        else {
            const media = {
                url: json['display_url'],
                isVideo: false
            }
            jsonRespone.media.push(media)
        }
    }
    return jsonRespone
}