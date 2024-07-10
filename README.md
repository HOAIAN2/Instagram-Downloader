# Instagram-Downloader

![icon](icons/icon128.png)

## Browser compatibility

This extension should work fine on the following browsers with `fetch()` API and Chromium base browser, tested Browser:

* Google Chrome
* MS Edge
* FireFox

## Install and usage

* Download [latest version](https://github.com/HOAIAN2/Instagram-Downloader/releases) and extract to a folder
* Enable Chrome extensions developer mode
* Drag and drop extracted folder to `chrome://extensions/`

## Usage

* Go to any `post`, `reels`, `stories`, etc. Then click `Download` button to fetch data.

* Click on any photos/videos to save.

* Toggle multi select by click on `Photos` and select photos by click on them (or select all by click and hold on `Photos`). Then click on `Download` to save zip file.

* If you scroll on the home page, this app will auto detect the post you wanna download so you don't have to click to comment section to open modal. It's not work 100% because sometime Instagram take a couple time to fetch data so that not trigger scroll event.

## Features

* Download posts ✔
* Download reels ✔
* Download latest stories ✔
* Download highlight stories ✔
* Support high resolution ✔
* Support download zip file ✔

## Customize

### Edit Hide / Show Transition effects

```css
.display-container.hide {
    transform-origin: 85% bottom;
    transform: scale(0);
    pointer-events: none;
    opacity: 0.6;
}
```

## Keyboard shortcut

* Download: `D`
* Close: `esc` `C` `c`
* Select all `S` `s`
* Keyboard shortcut should work if you don't focus on special HTML Elements like `input` `textarea` or any element with `textbox` role (ex: comment, search, ...)

## Deprecated features

These features was deprecated for some reason.

* V5.1.0
  * Set fallback download to latest post from some user.

## Here is Demo

[Demo v5.1.0](https://github.com/HOAIAN2/Instagram-Downloader/assets/98139595/917369c9-cdbb-4315-8e6d-7a1632a8888b)


