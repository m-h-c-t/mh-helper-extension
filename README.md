# MouseHunt Helper Extension
[![CI Lint & Test](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/ci.yml/badge.svg)](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/ci.yml)
[![Publish Extension](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/publish.yml/badge.svg)](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/publish.yml)
[![CodeQL](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/mh-community-tools/mh-helper-extension/actions/workflows/codeql-analysis.yml)

<a href="https://chrome.google.com/webstore/detail/mh-hunt-helper/ghfmjkamilolkalibpmokjigalmncfek" target="_blank"><img src="badge-chrome.png"></a>
<a href="https://addons.mozilla.org/en-US/firefox/addon/mhct-mousehunt-helper/" target="_blank"><img src="badge-firefox.png"></a>

### Introduction
This browser extension collects crowdsourced hunt info for [MouseHunt](https://www.mousehuntgame.com), a popular browser game from [HitGrab Inc.](https://www.hitgrab.com/) Collected data is inserted into a database that can be queried to gain insight about various game mechanics and interactions. It provides vital statistics for various community tools, such as catch rate estimators, map solvers, convertible trackers, spreadsheets, and more.

### Features
 - Collects hunt data (e.g. trap setup, mouse, location), map contents, crowns, and convertibles (e.g. treasure chests)
 - Only collects data from **active** hunts, not passive friend hunts or trap checks
 - Only collects game-related data (no names or personal information)
 - Does not modify anything in-game to provide an unfair advantage
 - Comes bundled with tsitu's [Auto-Loader](https://github.com/tsitu/MH-Tools/blob/master/src/bookmarklet/bookmarkletloader.js) bookmarklet

### Developers
All necessary files to run this extension are included in the `src` folder. After making changes, you may load it into your browser as a temporary add-on for testing & debugging purposes. However, please change the version number in `src/manifest.json` to avoid getting banned.

Nightly and weekly SQL backups are hosted on [Keybase](https://keybase.pub/devjacksmith/mh_backups/). They are also preloaded into handy [Docker images](https://hub.docker.com/r/tsitu/mhct-db-docker) if time is a greater bottleneck for you than bandwidth.

### Screenshots
<kbd align="center">
<img src="https://user-images.githubusercontent.com/8228441/46922950-0a6e1800-cfce-11e8-9981-1ad2eb80db9f.PNG" width="49%">
<img src="https://user-images.githubusercontent.com/8228441/46922951-0b06ae80-cfce-11e8-8b0f-7a41f69b734b.PNG" width="49%">
</kbd>

### Credits
Special thanks to all who have contributed with advice, bug reports, or code! A few honorable mentions: Jack (OG creator), tehhowch, AardWolf, tsitu, Loaf, groupsky, Nick (HornTracker), wOen, plasmoidia, Mistborn94, and the Discord server mods.
