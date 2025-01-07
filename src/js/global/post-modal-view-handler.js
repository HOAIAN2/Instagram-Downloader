/**
 * I have the algorithm that Instagram use to convert between post id and post shortcode.
 * But if the post is from a private profile, they add some extra stuff to the shortcode.
 * And I don't know how to convert between them.
 * So I wrote this to cache post id when user view post to reduce one api call.
 * 
 */
window.addEventListener('pathChange', (e) => {
    /**
     * Article element only avaiable right away when view post from /explore or from profile page
     * Otherwise Instagram wait until api call success and render it.
    */
    let article = document.querySelector('article[role="presentation"]');

    const observer = new MutationObserver(() => {
        const postInfo = getValueByKey(article, 'post');
        if (postInfo) {
            if (postInfo.id && postInfo.code) {
                window.dispatchEvent(new CustomEvent('postView', {
                    detail: {
                        id: postInfo.id,
                        code: postInfo.code
                    }
                }));
            }
            stopObserve();
        }
        else {
            article = document.querySelector('article[role="presentation"]');
        }
    });

    function startObserve() {
        observer.observe(document.body, {
            attributes: true, childList: true, subtree: true
        });
    }

    function stopObserve() {
        observer.disconnect();
    }
    
    if (e.detail.currentPath.match(/\/(p|tv|reel|reels)\/([A-Za-z0-9_-]*)(\/?)/)) {
        startObserve();
    }
    else {
        stopObserve();
    }
});