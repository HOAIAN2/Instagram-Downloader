/**
 * This file is not include in manifest so it not run.
 * If this file run, every network call with XHR will be tracked.
 * So you don't need to call api to get data, just cacth the response somewhere.
 */

((xhr) => {
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    const setRequestHeader = XHR.setRequestHeader;
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
        this.addEventListener('load', () => {
            const url = this._url ? this._url.toLowerCase() : this._url;
            const match = urlPatterns.some(pattern => pattern.test(url));
            if (!match) return;
            window.dispatchEvent(new CustomEvent('apiCall', {
                detail: {
                    body: postData,
                    request: this
                }
            }));
        });
        return send.apply(this, arguments);
    };

})(XMLHttpRequest);

window.addEventListener('apiCall', e => {
    if (e.detail.request._url.match(/api\/v1\/media\/\d*\/info\//)) {
        const response = JSON.parse(e.detail.request.response);
        const edges = response.items[0];
        const data = {
            date: '',
            user: {
                username: edges.user['username'],
                fullName: edges.user['full_name'],
            },
            medias: []
        };
        data.date = edges['taken_at'];
        if (edges['carousel_media']) {
            edges['carousel_media'].forEach((item) => {
                const media = {
                    url: item['media_type'] === 1 ? item['image_versions2'].candidates[0]['url'] : item['video_versions'][0].url,
                    isVideo: item['media_type'] === 1 ? false : true,
                    id: item.id.split('_')[0]
                };
                if (media.isVideo) media.thumbnail = item['image_versions2'].candidates[0]['url'];
                data.medias.push(media);
            });
        }
        else {
            const media = {
                url: edges['media_type'] === 1 ? edges['image_versions2'].candidates[0]['url'] : edges['video_versions'][0].url,
                isVideo: edges['media_type'] === 1 ? false : true,
                id: edges.id.split('_')[0]
            };
            if (media.isVideo) media.thumbnail = edges['image_versions2'].candidates[0]['url'];
            data.medias.push(media);
        }
        window.dispatchEvent(new CustomEvent('postLoad', {
            detail: {
                shortcode: edges.code,
                data: data
            }
        }));
    }

    const searchParams = new URLSearchParams(e.detail.body);
    const fbApiReqFriendlyName = searchParams.get('fb_api_req_friendly_name');

    if (fbApiReqFriendlyName === 'PolarisStoriesV3ReelPageGalleryQuery'
        || fbApiReqFriendlyName === 'PolarisStoriesV3ReelPageGalleryPaginationQuery'
    ) {
        const response = JSON.parse(e.detail.request.response);
        const nodes = response.data['xdt_api__v1__feed__reels_media__connection'].edges;
        nodes.forEach(node => {
            const data = {
                date: node.node.items[0].taken_at,
                user: {
                    username: node.node.user.username,
                    fullName: '',
                },
                medias: []
            };
            node.node.items.forEach(item => {
                const media = {
                    url: item['media_type'] === 1 ? item['image_versions2'].candidates[0]['url'] : item['video_versions'][0].url,
                    isVideo: item['media_type'] === 1 ? false : true,
                    id: item.id.split('_')[0]
                };
                if (media.isVideo) media.thumbnail = item['image_versions2'].candidates[0]['url'];
                data.medias.push(media);
            });
            window.dispatchEvent(new CustomEvent('storiesLoad', {
                detail: data
            }));
            window.dispatchEvent(new CustomEvent('userLoad', {
                detail: {
                    username: node.node.user.username,
                    id: node.node.user.pk
                }
            }));
        });
    }

    if (fbApiReqFriendlyName === 'PolarisStoriesV3ReelPageStandaloneDirectQuery') {
        const response = JSON.parse(e.detail.request.response);
        const nodes = response.data['xdt_api__v1__feed__reels_media']['reels_media'];
        nodes.forEach(node => {
            const data = {
                date: node.items[0].taken_at,
                user: {
                    username: node.user.username,
                    fullName: '',
                },
                medias: []
            };
            node.items.forEach(item => {
                const media = {
                    url: item['media_type'] === 1 ? item['image_versions2'].candidates[0]['url'] : item['video_versions'][0].url,
                    isVideo: item['media_type'] === 1 ? false : true,
                    id: item.id.split('_')[0]
                };
                if (media.isVideo) media.thumbnail = item['image_versions2'].candidates[0]['url'];
                data.medias.push(media);
            });
            window.dispatchEvent(new CustomEvent('storiesLoad', {
                detail: data
            }));
            window.dispatchEvent(new CustomEvent('userLoad', {
                detail: {
                    username: node.user.username,
                    id: node.user.pk
                }
            }));
        });
    }
    if (fbApiReqFriendlyName === 'PolarisStoriesV3HighlightsPageQuery') {
        const response = JSON.parse(e.detail.request.response);
        const nodes = response.data['xdt_api__v1__feed__reels_media__connection'].edges;
        nodes.forEach(node => {
            const data = {
                date: node.node.items[0].taken_at,
                user: {
                    username: node.node.user.username,
                    fullName: '',
                },
                medias: []
            };
            node.node.items.forEach(item => {
                const media = {
                    url: item['media_type'] === 1 ? item['image_versions2'].candidates[0]['url'] : item['video_versions'][0].url,
                    isVideo: item['media_type'] === 1 ? false : true,
                    id: item.id.split('_')[0]
                };
                if (media.isVideo) media.thumbnail = item['image_versions2'].candidates[0]['url'];
                data.medias.push(media);
            });
            window.dispatchEvent(new CustomEvent('highlightsLoad', {
                detail: {
                    id: node.node.id.split(':')[1],
                    data: data
                }
            }));
        });
    }
});