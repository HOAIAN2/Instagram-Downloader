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

* Click `Download` button to fetch data

* Click on any photos/videos to save

* Toggle multi select by click on ```Photos``` and select photos by click on them (or select all by click and hold on ```Photos```). Then click on ```Download``` to save zip file

## Features

* Download posts ✔
* Download reels ✔
* Download latest stories ✔
* Download highlight stories ✔
* Support high resolution ✔
* Support download zip file ✔

## Customize

## Config default download

Set default username, so extension can download their latest post when app first load.

1. Hold the download button
2. Change username in textbox
3. Save and close.

### Edit Hide / Show Transition effects

```css
.display-container.hide {
    transform-origin: right bottom;
    transform: scale(0);
    pointer-events: none;
    opacity: 0.1;
}
```

## Keyboard shortcut

* Download: `D`
* Close: `esc` `C` `c`
* Select all `S` `s`
* Keyboard shortcut should work if you don't focus on special HTML Elements like `input` `textarea` or any element with ```textbox``` role (ex: comment, search, ...)

## Here is Demo

[Demo](https://github.com/HOAIAN2/Instagram-Downloader/assets/98139595/5bc354ab-b00a-4ec3-9727-493c6804040e)
