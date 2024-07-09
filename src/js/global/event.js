(() => {
	let path = window.location.pathname;
	const observer = new MutationObserver(() => {
		const newPath = window.location.pathname;
		if (newPath !== path) {
			path = newPath;
			window.dispatchEvent(new CustomEvent('pathChange', {
				detail: {
					oldPath: path,
					currentPath: newPath
				}
			}));
		}
	});
	observer.observe(document.body, {
		childList: true, subtree: true
	});
})();