const IG_BASE_URL = window.location.origin + '/';
/**
 * @deprecated
 */
const IG_PROFILE_HASH = '69cba40317214236af40e7efa697781d';
/**
 * @deprecated
 */
const IG_POST_HASH = '9f8827793ef34641b2fb195d4d41151c';

const IG_SHORTCODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const IG_POST_REGEX = /\/(p|tv|reel|reels)\/([A-Za-z0-9_-]*)(\/?)/;
const IG_STORY_REGEX = /\/(stories)\/(.*?)\/(\d*)(\/?)/;
const IG_HIGHLIGHT_REGEX = /\/(stories)\/(highlights)\/(\d*)(\/?)/;

const APP_NAME = `${chrome.runtime.getManifest().name} v${chrome.runtime.getManifest().version}`;

const appCache = Object.freeze({
    /**
     * Cache user id, reduce one api call to get id from username
     * 
     * username => id
     */
    userIdsCache: new Map(),
    /**
     * Cache post id, reduce one api call to get post id from shortcode.
     * 
     * Only for private profile, check out  post-modal-view-handler.js
     * 
     * shortcode => post_id
     */
    postIdInfoCache: new Map(),
});

const appState = Object.freeze((() => {
    let currentDisplay = '';
    const current = {
        shortcode: '',
        username: '',
        highlights: '',
    };
    const previous = {
        shortcode: '',
        username: '',
        highlights: '',
    };
    window.addEventListener('shortcodeChange', e => {
        current.shortcode = e.detail.code;
    });
    return {
        get currentDisplay() { return currentDisplay; },
        set currentDisplay(value) { if (['post', 'stories', 'highlights'].includes(value)) currentDisplay = value; },
        current: Object.freeze({
            get shortcode() { return current.shortcode; },
            set shortcode(value) {
                current.shortcode = value;
                downloadPostPhotos().then(data => {
                    renderMedias(data);
                    currentDisplay = 'post';
                });
            },
            get username() { return current.username; },
            set username(value) {
                current.username = value;
                downloadStoryPhotos('stories').then(data => {
                    renderMedias(data);
                    currentDisplay = 'stories';
                });
            },
            get highlights() { return current.highlights; },
            set highlights(value) {
                current.highlights = value;
                downloadStoryPhotos('highlights').then(data => {
                    renderMedias(data);
                    currentDisplay = 'hightlights';
                });
            },
        }),
        setCurrentShortcode() {
            const page = window.location.pathname.match(IG_POST_REGEX);
            if (page) current.shortcode = page[2];
        },
        setCurrentUsername() {
            const page = window.location.pathname.match(IG_STORY_REGEX);
            if (page && page[2] !== 'highlights') current.username = page[2];
        },
        setCurrentHightlightsId() {
            const page = window.location.pathname.match(IG_HIGHLIGHT_REGEX);
            if (page) current.highlights = page[3];
        },
        setPreviousValues() {
            Object.keys(current).forEach(key => { previous[key] = current[key]; });
        },
        getFieldChange() {
            if (current.highlights !== previous.highlights) return 'highlights';
            if (current.username !== previous.username) return 'stories';
            if (current.shortcode !== previous.shortcode) return 'post';
            return 'none';
        },
    };
})());

(() => {
    function createElement(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html').body;
        const fragment = document.createDocumentFragment();
        fragment.append(...doc.childNodes);
        return fragment;
    }
    function initUI() {
        document.body.appendChild(createElement(
            `<div class="display-container hide">
                <div class="title-container">
                    <span title="${APP_NAME}">Medias</span>
                    <button class="esc-button">&times</button>
                </div>
                <div class="medias-container">
                    <p style="position: absolute;top: 50%;transform: translate(0%, -50%);">
                        Nothing to download
                    </p>
                </div>
            </div>
            <button class="download-button">Download</button>`));
    }
    function handleEvents() {
        const ESC_BUTTON = document.querySelector('.esc-button');
        const TITLE_CONTAINER = document.querySelector('.title-container').firstElementChild;
        const DISPLAY_CONTAINER = document.querySelector('.display-container');
        const DOWNLOAD_BUTTON = document.querySelector('.download-button');
        const IGNORE_FOCUS_ELEMENTS = ['INPUT', 'TEXTAREA'];
        const ESC_EVENT_KEYS = ['Escape', 'C', 'c'];
        const DOWNLOAD_EVENT_KEYS = ['D'];
        const SELECT_EVENT_KEYS = ['S', 's'];
        function setTheme() {
            const isDarkMode = localStorage.getItem('igt') === null ?
                window.matchMedia('(prefers-color-scheme: dark)').matches :
                localStorage.getItem('igt') === 'dark';
            if (isDarkMode) {
                DISPLAY_CONTAINER.classList.add('dark');
                DISPLAY_CONTAINER.firstElementChild.classList.add('dark');
            }
            else {
                DISPLAY_CONTAINER.classList.remove('dark');
                DISPLAY_CONTAINER.firstElementChild.classList.remove('dark');
            }
        }
        function pauseVideo() {
            if (DISPLAY_CONTAINER.classList.contains('hide')) {
                DISPLAY_CONTAINER.querySelectorAll('video').forEach(video => {
                    video.pause();
                });
            }
        }
        function toggleSelectMode() {
            if (TITLE_CONTAINER.classList.contains('multi-select')) {
                TITLE_CONTAINER.title = 'Hold to select / deselect all';
                DISPLAY_CONTAINER.querySelectorAll('.overlay').forEach(element => {
                    element.classList.add('show');
                });
            }
            else {
                TITLE_CONTAINER.textContent = 'Medias';
                TITLE_CONTAINER.title = APP_NAME;
                DISPLAY_CONTAINER.querySelectorAll('.overlay').forEach(element => {
                    element.classList.remove('show');
                });
            }
        }
        function handleSelectAll() {
            if (!TITLE_CONTAINER.classList.contains('multi-select')) return;
            const totalItem = Array.from(DISPLAY_CONTAINER.querySelectorAll('.overlay'));
            const totalItemChecked = Array.from(DISPLAY_CONTAINER.querySelectorAll('.overlay.checked'));
            if (totalItemChecked.length !== totalItem.length) totalItem.forEach(item => {
                if (!item.classList.contains('saved')) item.classList.add('checked');
            });
            else {
                totalItem.forEach(item => { item.classList.remove('checked'); });
            }
        }
        function setSelectedMedias() {
            if (TITLE_CONTAINER.classList.contains('multi-select')) {
                TITLE_CONTAINER.textContent = `Selected ${DISPLAY_CONTAINER.querySelectorAll('.overlay.checked').length}`;
            }
        }
        function handleChatTab() {
            const reactRoot = document.body.querySelector('[id]');
            const rootObserver = new MutationObserver(() => {
                const chatTabsRootContent = document.querySelector('[data-pagelet="IGDChatTabsRootContent"]');
                if (!chatTabsRootContent) {
                    return;
                }
                const tabChatWrapper = chatTabsRootContent.querySelector('[data-visualcompletion="ignore"]').childNodes[0];
                if (tabChatWrapper.childNodes.length > 1) {
                    const actualTabChat = tabChatWrapper.lastChild;
                    if (actualTabChat.checkVisibility({ checkVisibilityCSS: true })) {
                        DOWNLOAD_BUTTON.setAttribute('hidden', 'true');
                        DISPLAY_CONTAINER.classList.add('hide');
                        DISPLAY_CONTAINER.setAttribute('style', 'display: none;');
                        requestAnimationFrame(() => {
                            DISPLAY_CONTAINER.removeAttribute('style');
                        });
                    }
                    else {
                        DOWNLOAD_BUTTON.removeAttribute('hidden');
                    }
                }
                else {
                    DOWNLOAD_BUTTON.removeAttribute('hidden');
                }
                return;
            });

            rootObserver.observe(reactRoot, {
                // attributes: true,
                childList: true,
                subtree: true
            });
        }
        const handleTheme = new MutationObserver(setTheme);
        const handleVideo = new MutationObserver(pauseVideo);
        const handleToggleSelectMode = new MutationObserver(toggleSelectMode);
        const handleSelectMedia = new MutationObserver(setSelectedMedias);
        handleTheme.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        handleVideo.observe(DISPLAY_CONTAINER, {
            attributes: true,
            attributeFilter: ['class']
        });
        handleToggleSelectMode.observe(TITLE_CONTAINER, {
            attributes: true,
            attributeFilter: ['class']
        });
        handleSelectMedia.observe(DISPLAY_CONTAINER.querySelector('.medias-container'), {
            attributes: true, childList: true, subtree: true
        });
        ESC_BUTTON.addEventListener('click', () => {
            DISPLAY_CONTAINER.classList.add('hide');
        });
        window.addEventListener('keydown', (e) => {
            if (window.location.pathname.startsWith('/direct')) return;
            if (IGNORE_FOCUS_ELEMENTS.includes(e.target.tagName)) return;
            if (e.target.role === 'textbox') return;
            if (e.ctrlKey) return;
            if (DOWNLOAD_EVENT_KEYS.includes(e.key)) {
                return DOWNLOAD_BUTTON.click();
            }
            if (ESC_EVENT_KEYS.includes(e.key)) {
                return ESC_BUTTON.click();
            }
            if (SELECT_EVENT_KEYS.includes(e.key) && !DISPLAY_CONTAINER.classList.contains('hide')) {
                return TITLE_CONTAINER.classList.toggle('multi-select');
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                DISPLAY_CONTAINER.querySelectorAll('video').forEach(video => {
                    video.pause();
                });
            }
        });
        handleLongClick(TITLE_CONTAINER, () => {
            TITLE_CONTAINER.classList.toggle('multi-select');
        }, handleSelectAll);
        DOWNLOAD_BUTTON.addEventListener('click', handleDownload);
        window.addEventListener('online', () => {
            DISPLAY_CONTAINER.querySelectorAll('img , video').forEach(media => {
                media.src = media.src;
            });
        });
        window.addEventListener('pathChange', () => {
            if (window.location.pathname.startsWith('/direct')) {
                DOWNLOAD_BUTTON.setAttribute('hidden', 'true');
                DISPLAY_CONTAINER.classList.add('hide');
                DISPLAY_CONTAINER.setAttribute('style', 'display: none;');
                requestAnimationFrame(() => {
                    DISPLAY_CONTAINER.removeAttribute('style');
                });
            }
            else DOWNLOAD_BUTTON.removeAttribute('hidden');
        });
        window.addEventListener('userLoad', e => {
            appCache.userIdsCache.set(e.detail.username, e.detail.id);
        });
        window.addEventListener('postView', e => {
            if (appCache.postIdInfoCache.has(e.detail.id)) return;
            // Check valid shortcode
            if (e.detail.code.startsWith(convertToShortcode(e.detail.id))) {
                appCache.postIdInfoCache.set(e.detail.code, e.detail.id);
            }
        });
        setTheme();
        handleChatTab();
        if (window.location.pathname.startsWith('/direct')) {
            DOWNLOAD_BUTTON.setAttribute('hidden', 'true');
            DISPLAY_CONTAINER.classList.add('hide');
        }
    }
    function run() {
        document.querySelectorAll('.display-container, .download-button').forEach(node => {
            node.remove();
        });
        initUI();
        handleEvents();
    }
    run();
})();