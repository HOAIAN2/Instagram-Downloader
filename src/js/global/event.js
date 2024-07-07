(() => {
	let path = window.location.pathname;
	const observer = new MutationObserver(() => {
		const newPath = window.location.pathname;
		if (newPath !== path) {
			const pathChangeEvent = new CustomEvent('pathChange', {
				detail: {
					oldPath: path,
					currentPath: newPath
				}
			});
			path = newPath;
			window.dispatchEvent(pathChangeEvent);
		}
	});
	observer.observe(document.body, {
		attributes: true, childList: true, subtree: true
	});
})();