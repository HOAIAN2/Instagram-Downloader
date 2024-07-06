// function homeScrollHandler() {
// 	const classNames = ['xsag5q8', 'x1e558r4'];
// 	function checkVisible(element) {
// 		const rect = element.getBoundingClientRect();
// 		const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
// 		return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
// 	}
// 	const postContainers = document.querySelectorAll('.' + classNames.join('.'));
// 	postContainers.forEach(container => {
// 		if (!checkVisible(container)) return;
// 		const fiber = container[Object.keys(container)[1]];
// 		if (fiber.children.props.mediaFragmentKey) {
// 			const postId = fiber.children.props.mediaFragmentKey.pk;
// 			window.dispatchEvent(new CustomEvent('postIdChange', {
// 				detail: {
// 					value: postId
// 				}
// 			}));
// 		}
// 		container.parentNode.querySelector('[role="presentation"]');
// 	});
// }
function homeScrollHandler() {
	const classNames = ['xsag5q8', 'x1e558r4'];
	function getVisibleArea(element) {
		const rect = element.getBoundingClientRect();
		const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
		const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
		const height = Math.max(0, Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0));
		const width = Math.max(0, Math.min(rect.right, viewWidth) - Math.max(rect.left, 0));
		return height * width;
	}
	const postContainers = Array.from(document.querySelectorAll('.' + classNames.join('.')));
	let maxVisibleArea = 0;
	let mostVisibleElement = null;
	postContainers.forEach(container => {
		const presentationElement = container.parentNode;
		if (!presentationElement) return;
		const visibleArea = getVisibleArea(presentationElement);
		if (visibleArea > maxVisibleArea) {
			maxVisibleArea = visibleArea;
			mostVisibleElement = container;
		}
	});
	if (mostVisibleElement) {
		const fiber = mostVisibleElement[Object.keys(mostVisibleElement)[1]];
		if (fiber.children.props.mediaFragmentKey) {
			const postId = fiber.children.props.mediaFragmentKey.pk;
			window.dispatchEvent(new CustomEvent('postIdChange', {
				detail: {
					value: postId
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