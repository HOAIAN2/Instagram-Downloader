(function (xhr) {
	const XHR = XMLHttpRequest.prototype;
	const open = XHR.open;
	const send = XHR.send;
	let setRequestHeader = XHR.setRequestHeader;
	const urlPatterns = [
		/graphql\/query/,
		// /api\/v1\/media\/\d*\/info\//
	];

	XHR.open = function (method, url) {
		this._method = method;
		this._url = url;
		this._requestHeaders = {};
		this._startTime = (new Date()).toISOString();

		return open.apply(this, arguments);
	};

	XHR.setRequestHeader = function (header, value) {
		this._requestHeaders[header] = value;
		return setRequestHeader.apply(this, arguments);
	};

	XHR.send = function (postData) {
		this.addEventListener('load', function () {
			let endTime = (new Date()).toISOString();
			let myUrl = this._url ? this._url.toLowerCase() : this._url;
			let match = urlPatterns.some(pattern => pattern.test(myUrl));

			if (!match) {
				return;
			}

			if (postData) {
				if (typeof postData === 'string') {
					try {
						this._requestHeaders = postData;
					} catch (err) {
						console.log('Request Header JSON decode failed, transfer_encoding field could be base64');
						console.log(err);
					}
				} else if (typeof postData === 'object') {
					// console.log('Request Payload:', JSON.stringify(postData, null, 2));
				}
			}
			let responseHeaders = this.getAllResponseHeaders();
			if (this.responseType != 'blob' && this.responseText) {
				// ResponseText is string or null
				try {
					// let responseBody = this.responseText;
				} catch (err) {
					console.log("Error in responseType try catch");
					console.log(err);
				}
			}
			window.dispatchEvent(new CustomEvent('requestSend', {
				detail: {
					body: postData,
					request: this
				}
			}));
		});

		return send.apply(this, arguments);
	};

})(XMLHttpRequest);

window.addEventListener('requestSend', e => {
	// if (e.detail.request._url.match(/api\/v1\/media\/\d*\/info\//)) {
	// 	const response = JSON.parse(e.detail.request.response);
	// 	console.log('post detail call');
	// 	console.log(response);
	// }
	const searchParams = new URLSearchParams(e.detail.body);
	const fbApiReqFriendlyName = searchParams.get('fb_api_req_friendly_name');

	if (fbApiReqFriendlyName === 'PolarisStoriesV3ReelPageGalleryQuery'
		|| fbApiReqFriendlyName === 'PolarisStoriesV3ReelPageGalleryPaginationQuery'
	) {
		const response = JSON.parse(e.detail.request.response);
		response.data['xdt_api__v1__feed__reels_media__connection'].edges.forEach(node => {
			window.dispatchEvent(new CustomEvent('userAvailable', {
				detail: {
					username: node.node.user.username,
					id: node.node.user.pk
				}
			}));
		});
	}

	if (fbApiReqFriendlyName === 'PolarisStoriesV3ReelPageStandaloneDirectQuery') {
		const response = JSON.parse(e.detail.request.response);
		response.data['xdt_api__v1__feed__reels_media']['reels_media'].forEach(node => {
			window.dispatchEvent(new CustomEvent('userAvailable', {
				detail: {
					username: node.user.username,
					id: node.user.pk
				}
			}));
		});
	}
	if (fbApiReqFriendlyName === 'PolarisStoriesV3HighlightsPageQuery') {
		// const response = JSON.parse(e.detail.request.response);
	}
});