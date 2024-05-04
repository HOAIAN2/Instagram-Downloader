// history path changed event
{
	let path = window.location.pathname
	const observer = new MutationObserver(() => {
		const newPath = window.location.pathname
		if (newPath !== path) {
			const pathChangedEvent = new CustomEvent('pathChanged', {
				detail: {
					oldPath: path,
					currentPath: newPath
				}
			})
			path = newPath
			window.dispatchEvent(pathChangedEvent)
		}
	})
	observer.observe(document.body, {
		attributes: true, childList: true, subtree: true
	})
}