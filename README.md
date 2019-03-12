# MouseHunt Helper Extension

<a href="https://chrome.google.com/webstore/detail/mh-hunt-helper/ghfmjkamilolkalibpmokjigalmncfek" target="_blank"><img src="https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_206x58.png"></a>
<a href="https://addons.mozilla.org/en-US/firefox/addon/jacks-mousehunt-helper" target="_blank"><img src="https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png"></a>
<a href="https://addons.opera.com/en/extensions/details/jacks-mousehunt-helper" target="_blank"><img src="https://dev.opera.com/extensions/branding-guidelines/addons_206x58_en@2x.png" style="width:206px"></a>

### Introduction
This browser extension collects hunt info for [MouseHunt](https://www.mousehuntgame.com), a popular browser game developed by HitGrab. The collected information is used to create a crowdsourced dataset that can be used to gain insight about various game mechanics and interactions. It also serves as the backbone of tools such as catch rate estimators, map solvers, and convertible trackers, enabling players to get more out of their MH experience.

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
Special thanks to all who have contributed with advice, bug reports, or code. A few honorable mentions: tehhowch, Aardwolf, tsitu, Loaf, Groupsky, Nick (HornTracker), and the Discord server mods!
