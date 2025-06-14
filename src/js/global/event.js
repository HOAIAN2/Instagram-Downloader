/**
 * 
 * Navigation API not work on FireFox, so I have to override History API
 * 
 */
(function () {
    let path = window.location.pathname;
    // Save the original methods to call them later
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const dispatchPathChangeEvent = () => {
        const newPath = window.location.pathname;
        if (newPath !== path) {
            window.dispatchEvent(new CustomEvent('pathChange', {
                detail: {
                    oldPath: path,
                    currentPath: newPath
                }
            }));
            path = newPath;
        }
    };

    // Override pushState
    history.pushState = function (...args) {
        originalPushState.apply(this, args);
        dispatchPathChangeEvent();
    };

    // Override replaceState
    history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        dispatchPathChangeEvent();
    };

    // Listen to the popstate event
    window.addEventListener('popstate', () => {
        dispatchPathChangeEvent();
    });
})();