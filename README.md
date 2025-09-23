# MouseHunt Helper Extension

[![CI Lint & Test](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/ci.yml)
[![Publish Extension](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/publish.yml/badge.svg)](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/publish.yml)
[![CodeQL](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/codeql-analysis.yml)

<a href="https://chrome.google.com/webstore/detail/mh-hunt-helper/ghfmjkamilolkalibpmokjigalmncfek" target="_blank"><img src="badge-chrome.png"></a>
<a href="https://addons.mozilla.org/en-US/firefox/addon/mhct-mousehunt-helper/" target="_blank"><img src="badge-firefox.png"></a>

## Introduction

This browser extension collects crowdsourced hunt info for [MouseHunt](https://www.mousehuntgame.com), a popular browser game from [HitGrab Inc.](http://www.hitgrab.com/) Collected data is inserted into a database that can be queried to gain insight about various game mechanics and interactions. It provides vital statistics for various community tools, such as catch rate estimators, map solvers, convertible trackers, spreadsheets, and more.

### Features

- Collects hunt data (e.g. trap setup, mouse, location), map contents, crowns, and convertibles (e.g. treasure chests)
- Only collects data from **active** hunts, not passive friend hunts or trap checks
- Only collects game-related data (no names or personal information)
- Does not modify anything in-game to provide an unfair advantage
- Comes bundled with tsitu's [Auto-Loader](https://github.com/tsitu/MH-Tools/blob/master/src/bookmarklet/bookmarkletloader.js) bookmarklet

### Developers

Requirements: Node v22 or newer installed.  
Run the following commands to install dependencies and start developing.  

```cmd
npm install
npm run dev
```

#### Scripts

- `npm run dev` - builds the extension and watches for changes; loads the extension in a temporary browser profile
- `npm run build` - build the extension (defaults to chrome)
- `npm run build:watch` - build the the extension and rebuild on subsequent changes
- `npm run start` - loads the extension into a temporary browser profile

All of these commands can be affixed with `:firefox` if you want to do the same for the firefox browser.

The necessary files to run, test and debug this extension are included in the `dist\<browser>` folder after building.  
Please keep the version in `src/manifest.json` at 0.0.0 to avoid getting banned.

### Screenshots

<kbd align="center">
<img src="https://user-images.githubusercontent.com/8228441/46922950-0a6e1800-cfce-11e8-9981-1ad2eb80db9f.PNG" width="49%">
<img src="https://user-images.githubusercontent.com/8228441/46922951-0b06ae80-cfce-11e8-8b0f-7a41f69b734b.PNG" width="49%">
</kbd>

### Credits

Special thanks to all who have contributed with advice, bug reports, or code! See [this page](https://mhct.win/contributors.php) for all the people who helped so far.
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/R6R3H0L26)
