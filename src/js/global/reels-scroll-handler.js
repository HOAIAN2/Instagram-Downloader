window.addEventListener('pathChange', e => {
    // Scroll on /reels/:code page like tiktok
    const match = e.detail.currentPath.match(/\/(reels)\/([A-Za-z0-9_-]*)(\/?)/);
    if (match) {
        const reels = document.querySelectorAll('main>div>div:nth-child(odd)');
        reels.forEach(element => {
            const queryReference = getValueByKey(element, 'queryReference');
            if (queryReference?.pk && queryReference?.code && queryReference?.code === match[2]) {
                window.dispatchEvent(new CustomEvent('postView', {
                    detail: {
                        id: queryReference.pk,
                        code: queryReference.code,
                    }
                }));
                return;
            }
        });
    }
});