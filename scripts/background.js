// Update check
chrome.runtime.onUpdateAvailable.addListener(function(details) {
    console.log("MHHH: updating to version " + details.version);
    chrome.runtime.reload();
});

var time_interval = 7200 * 1000; // seconds * 1000
window.setInterval(function() {
    chrome.runtime.requestUpdateCheck(function(status) {
        if (status == "update_available") {
            console.log("MHHH: update pending...");
        } else if (status == "no_update") {
            console.log("MHHH: no update found");
        } else if (status == "throttled") {
            console.log("MHHH: Oops, update check failed.");
        }
    });
}, time_interval);

// Refreshes mh pages when new version is installed
chrome.runtime.onInstalled.addListener( function(details) {
    chrome.tabs.query({'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']}, function(tabs) {
        if ( tabs.length > 0 ) {
            for(i = 0; i<tabs.length; i++) {
                chrome.tabs.reload(tabs[i].id);
            }
        }
    });
});
