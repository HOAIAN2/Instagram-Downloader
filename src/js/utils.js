function isValidJson(string) {
	try {
		JSON.parse(string)
		return true
	} catch {
		return false
	}
}

function saveFile(blob, fileName) {
	const a = document.createElement('a')
	a.download = fileName
	a.href = URL.createObjectURL(blob)
	a.click()
	URL.revokeObjectURL(a.href)
}

function getAuthOptions() {
	const csrftoken = document.cookie.split(' ')[2].split('=')[1]
	const claim = sessionStorage.getItem('www-claim-v2')
	const options = {
		headers: {
			// Hardcode variable: a="129477";f.ASBD_ID=a in JS, can be remove
			// 'x-asbd-id': '129477',
			'x-csrftoken': csrftoken,
			'x-ig-app-id': APP_ID,
			'x-ig-www-claim': claim,
			// 'x-instagram-ajax': '1006598911',
			'x-requested-with': 'XMLHttpRequest'
		},
		referrer: window.location.href,
		referrerPolicy: 'strict-origin-when-cross-origin',
		method: 'GET',
		mode: 'cors',
		credentials: 'include'
	}
	return options
}

function findValueByKey(obj, key) {
	if (typeof obj !== 'object' || obj === null) return null
	if (Array.isArray(obj)) {
		for (const element of obj) {
			const result = findValueByKey(element, key)
			if (result !== null) return result
		}
		return null
	}
	if (obj.hasOwnProperty(key)) return obj[key]
	for (const prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			const result = findValueByKey(obj[prop], key)
			if (result !== null) return result
		}
	}
	return null
}