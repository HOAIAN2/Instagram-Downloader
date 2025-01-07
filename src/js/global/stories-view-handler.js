window.addEventListener('pathChange', (e) => {
    if (e.detail.currentPath.match(/\/(stories)\/(.*?)\/(\d*)(\/?)/)) {
        const section = Array.from(document.querySelectorAll('section')).pop();
        const username = getValueByKey(section, 'username');
        const userId = getValueByKey(section, 'userId');
        if (username && userId)
            window.dispatchEvent(new CustomEvent('userLoad', {
                detail: {
                    username: username,
                    id: userId
                }
            }));
    }
});