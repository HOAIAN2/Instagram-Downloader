window.addEventListener('pathChange', (e) => {
    if (e.detail.currentPath.match(/\/(stories)\/(.*?)\/(\d*)(\/?)/)) {
        /**
         * Why setTimeout needed?
         * Because Instagram will load ads before stories and make userId and username mismatch
         * So you need to "wait" the stories to fully load to get correct username and userId
         */
        setTimeout(() => {
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
        }, 0);
    }
});