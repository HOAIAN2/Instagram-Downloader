function setCurrentShortcode() {
    const postRegex = /\/(p|tv|reel|reels)\/(.*?)\//
    const page = window.location.pathname.match(postRegex)
    if (page) appLog.current.shortcode = page[2]
}
function convertToPostID(shortcode) {
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let upper = lower.toUpperCase();
    let numbers = '0123456789'
    let igAlphabet = upper + lower + numbers + '-_'
    let bigIntAlphabet = numbers + lower
    let o = shortcode.replace(/\S/g, m => {
        let c = igAlphabet.indexOf(m)
        let b = bigIntAlphabet.charAt(c)
        return (b != "") ? b : `<${c}>`
    })
    return bigInt(o, 64).toString(10)
}
async function getPostPhotos(options) {
    const postID = convertToPostID(appLog.current.shortcode)
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