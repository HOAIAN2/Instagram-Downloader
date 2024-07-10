// Different scope, have to redeclare: https://developer.chrome.com/docs/extensions/reference/api/scripting?hl=vi#type-ExecutionWorld
const findValueByKey = (obj, key) => {
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
};

(() => {
	function debounce(func, delay) {
		let timeout;
		return (...args) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => func.apply(this, args), delay);
		};
	};
	const homeScrollHandler = debounce(() => {
		function getVisibleArea(element) {
			const rect = element.getBoundingClientRect();
			const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
			const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
			const height = Math.max(0, Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0));
			const width = Math.max(0, Math.min(rect.right, viewWidth) - Math.max(rect.left, 0));
			return height * width;
		}
		const postContainers = Array.from(document.querySelectorAll('article'));
		const mostVisibleElement = postContainers.reduce((mostVisible, container) => {
			const visibleArea = getVisibleArea(container);
			return visibleArea > mostVisible.area ? { element: container, area: visibleArea } : mostVisible;
		}, { element: null, area: 0 }).element;

		if (mostVisibleElement) {
			const mediaFragmentKey = findValueByKey(mostVisibleElement, 'mediaFragmentKey');
			if (mediaFragmentKey) {
				window.dispatchEvent(new CustomEvent('shortcodeChange', {
					detail: {
						code: mediaFragmentKey.code
					}
				}));
			}
		}
	}, 100);
	const observer = new MutationObserver(homeScrollHandler);
	function startObserve() {
		const mainNode = document.querySelector('main');
		if (mainNode) observer.observe(mainNode, {
			attributes: true, childList: true, subtree: true
		});
		window.addEventListener('scroll', homeScrollHandler);
	}
	function stopObserve() {
		observer.disconnect();
		window.removeEventListener('scroll', homeScrollHandler);
	}
	window.addEventListener('pathChange', (e) => {
		if (e.detail.currentPath === '/') startObserve();
		else stopObserve();
	});
	if (window.location.pathname === '/') startObserve();
})();