// Different scope, have to redeclare: https://developer.chrome.com/docs/extensions/reference/api/scripting?hl=vi#type-ExecutionWorld
function findValueByKey(obj, key) {
	if (typeof obj !== 'object' || obj === null) return null;
	const stack = [obj];
	while (stack.length) {
		const current = stack.pop();
		if (current[key] !== undefined) return current[key];
		for (const value of Object.values(current)) {
			if (typeof value === 'object' && value !== null) stack.push(value);
		}
	}
	return null;
}

function homeScrollHandler() {
	function getVisibleArea(element) {
		const rect = element.getBoundingClientRect();
		const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
		const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
		const height = Math.max(0, Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0));
		const width = Math.max(0, Math.min(rect.right, viewWidth) - Math.max(rect.left, 0));
		return height * width;
	}
	const postContainers = Array.from(document.querySelectorAll('article'));
	let maxVisibleArea = 0;
	let mostVisibleElement = null;
	postContainers.forEach(container => {
		const visibleArea = getVisibleArea(container);
		if (visibleArea > maxVisibleArea) {
			maxVisibleArea = visibleArea;
			mostVisibleElement = container;
		}
	});
	if (mostVisibleElement) {
		const mediaFragmentKey = findValueByKey(mostVisibleElement, 'mediaFragmentKey');
		if (mediaFragmentKey) {
			window.dispatchEvent(new CustomEvent('postIdChange', {
				detail: {
					value: mediaFragmentKey.pk
				}
			}));
		}
	}
}

window.addEventListener('pathChange', (e) => {
	if (e.detail.currentPath === '/') document.addEventListener('scroll', homeScrollHandler);
	else document.removeEventListener('scroll', homeScrollHandler);
});

if (window.location.pathname === '/') document.addEventListener('scroll', homeScrollHandler);