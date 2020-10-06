# MouseHunt Helper Extension

<a href="https://chrome.google.com/webstore/detail/mh-hunt-helper/ghfmjkamilolkalibpmokjigalmncfek" target="_blank"><img src="badge-chrome.png"></a>
<a href="https://addons.mozilla.org/en-US/firefox/addon/jacks-mousehunt-helper" target="_blank"><img src="badge-firefox.png"></a>
<a href="https://addons.opera.com/en/extensions/details/jacks-mousehunt-helper" target="_blank"><img src="badge-opera.png" width="206"></a>

### Introduction
This browser extension collects hunt info for [MouseHunt](https://www.mousehuntgame.com), a popular browser game from [HitGrab Inc.](http://www.hitgrab.com/) Collected data is inserted into a crowdsourced database that can be queried to gain insight about various game mechanics and interactions. This database provides the statistics for tools such as catch rate estimators, map solvers, convertible trackers, and more.

### Features
 - Collects data from hunts (e.g. trap setup, mouse, location), maps, crowns, and convertibles (e.g. treasure chests)
 - Only collects hunt data from **active** hunts and not passive friend hunts or trap checks
 - Only collects game-related data (no names or personal information)
 - Does not change anything in-game to provide an unfair advantage
 - Comes bundled with tsitu's [Auto-Loader](https://github.com/tsitu/MH-Tools/blob/master/src/bookmarklet/bookmarkletloader.js) bookmarklet

### Developers
All necessary files to run this extension are included in the `src/` folder. After making changes, you may load it into your browser as a temporary add-on for testing & debugging purposes. However, please change the version number in `src/manifest.json` to avoid getting banned.

Nightly and weekly SQL backups are hosted on [Keybase](https://keybase.pub/devjacksmith/mh_backups/).

### Screenshots
<kbd align="center">
<img src="https://user-images.githubusercontent.com/8228441/46922950-0a6e1800-cfce-11e8-9981-1ad2eb80db9f.PNG" width="49%">
<img src="https://user-images.githubusercontent.com/8228441/46922951-0b06ae80-cfce-11e8-8b0f-7a41f69b734b.PNG" width="49%">
</kbd>

### Credits
Special thanks to all who have contributed with advice, bug reports, and/or code! A few honorable mentions: tehhowch, AardWolf, tsitu, Loaf, groupsky, Nick (HornTracker), wOen, and the Discord server mods.
