function convertToPostId(shortcode) {
	let id = BigInt(0);
	const instagramAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
	for (let i = 0; i < shortcode.length; i++) {
		let char = shortcode[i]
		id = (id * BigInt(64)) + BigInt(instagramAlphabet.indexOf(char))
	}
	return id.toString(10)
}

async function getPostIdFromAPI() {
	const apiURL = new URL('/graphql/query/', BASE_URL)
	apiURL.searchParams.set('query_hash', POST_HASH)
	apiURL.searchParams.set('variables', JSON.stringify({
		shortcode: appState.current.shortcode
	}))
	try {
		const respone = await fetch(apiURL.href)
		const json = await respone.json()
		return json.data['shortcode_media'].id
	} catch (error) {
		console.log(error)
		return null
	}
}

async function getPostPhotos(shortcode, options) {
	const postId = convertToPostId(shortcode)
	const apiURL = new URL(`/api/v1/media/${postId}/info/`, BASE_URL)
	try {
		let respone = await fetch(apiURL.href, options)
		if (respone.status === 400) {
			const postId = await getPostIdFromAPI()
			if (!postId) throw new Error('Network bug')
			const apiURL = new URL(`/api/v1/media/${postId}/info/`, BASE_URL)
			respone = await fetch(apiURL.href, options)
		}
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
	const json = await getPostPhotos(appState.current.shortcode, options)
	if (!json) return null
	data.user.username = json.user['username']
	data.user.fullName = json.user['full_name']
	data.date = json['taken_at']
	if (json['carousel_media']) {
		json['carousel_media'].forEach((item) => {
			const media = {
				url: item['media_type'] === 1 ? item['image_versions2'].candidates[0]['url'] : item['video_versions'][0].url,
				isVideo: item['media_type'] === 1 ? false : true,
				id: item.id.split('_')[0]
			}
			data.media.push(media)
		})
	}
	else {
		const media = {
			url: json['media_type'] === 1 ? json['image_versions2'].candidates[0]['url'] : json['video_versions'][0].url,
			isVideo: json['media_type'] === 1 ? false : true,
			id: json.id.split('_')[0]
		}
		data.media.push(media)
	}
	return data
}