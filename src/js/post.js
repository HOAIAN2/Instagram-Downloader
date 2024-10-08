function convertToPostId(shortcode) {
    let id = BigInt(0);
    for (let i = 0; i < shortcode.length; i++) {
        let char = shortcode[i];
        id = (id * BigInt(64)) + BigInt(IG_ALPHABET.indexOf(char));
    }
    return id.toString(10);
}

function convertToShortcode(postId) {
    let id = BigInt(postId);
    let shortcode = '';
    while (id > BigInt(0)) {
        const remainder = id % BigInt(64);
        shortcode = IG_ALPHABET[Number(remainder)] + shortcode;
        id = id / BigInt(64);
        id = id - (id % BigInt(1));
    }
    return shortcode;
}

async function getPostIdFromAPI() {
    const apiURL = new URL('/graphql/query/', IG_BASE_URL);
    apiURL.searchParams.set('query_hash', IG_POST_HASH);
    apiURL.searchParams.set('variables', JSON.stringify({
        shortcode: appState.current.shortcode
    }));
    try {
        const respone = await fetch(apiURL.href);
        const json = await respone.json();
        return json.data['shortcode_media'].id;
    } catch (error) {
        console.log(error);
        return null;
    }
}

async function getPostPhotos(shortcode) {
    const postId = convertToPostId(shortcode);
    const apiURL = new URL(`/api/v1/media/${postId}/info/`, IG_BASE_URL);
    try {
        const respone = await fetch(apiURL.href, getAuthOptions());
        const json = await respone.json();
        return json.items[0];
    } catch (error) {
        console.log(error);
        return null;
    }
}

async function downloadPostPhotos() {
    if (!appState.current.shortcode) return null;
    const json = await getPostPhotos(appState.current.shortcode);
    if (!json) return null;
    const data = {
        date: json['taken_at'],
        user: {
            username: json.user['username'],
        },
        medias: []
    };
    function extractMediaData(item) {
        const isVideo = item['media_type'] !== 1;
        const media = {
            url: isVideo ? item['video_versions'][0].url : item['image_versions2'].candidates[0].url,
            isVideo,
            id: item.pk
        };
        return media;
    };
    if (json.carousel_media) data.medias = json.carousel_media.map(extractMediaData);
    else data.medias.push(extractMediaData(json));
    return data;
}