function getUsername() {
    const DOWNLOADABLE_PAGE = ['stories']
    const currentPage = window.location.pathname.split('/')
    if (DOWNLOADABLE_PAGE.includes(currentPage[1])) username = currentPage[2]
    return username
}
async function getUserID(options) {
    try {
        const respone = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, options)
        const json = await respone.json()
        return json.data.user.id
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
async function downloadStoryPhotos() {
    const csrftoken = document.cookie.split(' ')[2].split('=')[1]
    const claim = sessionStorage.getItem('www-claim-v2')
    const options = {
        headers: {
            "x-asbd-id": "198387", // Unkown
            "x-csrftoken": csrftoken, // Cookie "csrftoken" can delete
            "x-ig-app-id": "936619743392459", // Unkown
            "x-ig-www-claim": claim, // Section "www-claim-v2"
            "x-instagram-ajax": "1006598911",
            "x-requested-with": "XMLHttpRequest"
        },
        referrer: "https://www.instagram.com/?theme=dark",
        referrerPolicy: "strict-origin-when-cross-origin",
        method: "GET",
        mode: "cors",
        credentials: "include"
    }
    const jsonRespone = {
        user: {
            username: '',
            fullName: '',
        },
        media: []
    }
    const userID = await getUserID(options)
    const json = await getStoryPhotos(userID, options)
    if (!json) return null
    jsonRespone.user.username = username
    jsonRespone.user.fullName = json.user["full_name"]
    json.items.forEach((item) => {
        if (item['media_type'] === 1) {
            const media = {
                url: item['image_versions2'].candidates[0].url,
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