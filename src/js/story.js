async function getUserIdFromSearch(username = appState.current.username) {
	if (appState.userIdsCache.has(username)) return appState.userIdsCache.get(username);
	const apiURL = new URL('/web/search/topsearch/', IG_BASE_URL);
	if (username) apiURL.searchParams.set('query', username);
	else apiURL.searchParams.set('query', appState.current.username);
	try {
		const respone = await fetch(apiURL.href);
		const json = await respone.json();
		return json.users[0].user['pk_id'];
	} catch (error) {
		console.log(error);
		return '';
	}
}

async function getUserId(options, username = appState.current.username) {
	if (appState.userIdsCache.has(username)) return appState.userIdsCache.get(username);
	const apiURL = new URL('/api/v1/users/web_profile_info/', IG_BASE_URL);
	if (username) apiURL.searchParams.set('username', username);
	else apiURL.searchParams.set('username', appState.current.username);
	try {
		const respone = await fetch(apiURL.href, options);
		const json = await respone.json();
		return json.data.user['id'];
	} catch (error) {
		console.log(error);
		return '';
	}
}

async function getStoryPhotos(userId, options) {
	const apiURL = new URL('/api/v1/feed/reels_media/', IG_BASE_URL);
	apiURL.searchParams.set('reel_ids', userId);
	try {
		const respone = await fetch(apiURL.href, options);
		const json = await respone.json();
		return json.reels[userId];
	} catch (error) {
		console.log(error);
		return null;
	}
}

async function getHighlightStory(highlightsId, options) {
	const apiURL = new URL('/api/v1/feed/reels_media/', IG_BASE_URL);
	apiURL.searchParams.set('reel_ids', `highlight:${highlightsId}`);
	try {
		const respone = await fetch(apiURL.href, options);
		const json = await respone.json();
		return json.reels[`highlight:${highlightsId}`];
	} catch (error) {
		console.log(error);
		return null;
	}
}

async function downloadStoryPhotos(type = 'stories') {
	const options = getAuthOptions();
	const data = {
		date: '',
		user: {
			username: '',
			fullName: '',
		},
		medias: []
	};
	let json = null;
	if (type === 'highlights') {
		if (!appState.current.highlights) return null;
		json = await getHighlightStory(appState.current.highlights, options);
	}
	else {
		const userId = await getUserId(options, appState.current.username);
		if (!userId) return null;
		json = await getStoryPhotos(userId, options);
	}
	if (!json) return null;
	data.user.username = json.user['username'];
	data.user.fullName = json.user['full_name'];
	data.date = json.items[0]['taken_at'];
	json.items.forEach((item) => {
		const media = {
			url: item['media_type'] === 1 ? item['image_versions2'].candidates[0]['url'] : item['video_versions'][0].url,
			isVideo: item['media_type'] === 1 ? false : true,
			id: item.id.split('_')[0]
		};
		if (media.isVideo) media.thumbnail = item['image_versions2'].candidates[0]['url'];
		data.medias.push(media);
	});
	return data;
}