# Instagram-Downloader

![](icons/icon128.png)

### Browser compatibility ###

This extension should work fine on the following browsers with `fetch()` API:
* Google Chrome
* MS Edge
### Install and usage ###
* Download [latest version](https://github.com/HOAIAN2/Instagram-Downloader/releases) and extract to a folder
* Enable Chrome extensions developer mode
* Drag and drop extracted folder to `chrome://extensions/`
* Click `Download` button to fetch data then click on any photos/videos to save
### Features ###
* Download posts ✔
* Download reels ✔
* Download latest stories ✔
* Download highlight stories ✔
### Customize
* There's no shortcode to download any post when you first load, so I prefer you put one user id in ```main()``` function. So when you go to Instagram, it will set default shortcode as latest post from that user (I set default user id is Tzuyu).
```js
main(profileID)
```
* Edit Hide / Show Transition effects
```css
.display-container.hide {
    transform-origin: right bottom;
    transform: scale(0);
    pointer-events: none;
    opacity: 0.1;
}
```
### Keyboard shortcut ###
* Download: `D` `d`
* Close: `esc` `C` `c`
* Keyboard shortcut should work if you don't focus on special HTML Elements like `input` `textarea` (ex: comment, search, ...)
## Here is Demo
[Demo](https://user-images.githubusercontent.com/98139595/208013689-2b731fc1-75fb-48b1-b6a6-6d84ab46e740.mp4)
