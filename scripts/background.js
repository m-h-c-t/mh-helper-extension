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

// icon_timer, horn_sound and horn_alert
var sound_file = chrome.extension.getURL('sounds/bell.mp3');
var notification_done = false;
setInterval(function() {
    check_settings(icon_timer_find_open_mh_tab);
}, 1000);


function check_settings(callback) {
    chrome.storage.sync.get({
        success_messages: true, // defaults
        error_messages: true, // defaults
        icon_timer: true, // defaults
        horn_sound: false, // defaults
        horn_alert: false, // defaults
        track_crowns: true // defaults
    }, function (settings) {
        callback(settings);
    });
}

function icon_timer_find_open_mh_tab(settings) {
    chrome.tabs.query({'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']}, function(found_tabs) {
        if ( found_tabs.length > 0 ) {
            icon_timer_updateBadge(found_tabs[0].id, settings);
        } else {
            icon_timer_updateBadge(false, settings);
        }
    });
}

function icon_timer_updateBadge(tab_id, settings) {
    if (tab_id === false) {
        chrome.browserAction.setBadgeText({text: ''});
        return;
    }

    chrome.tabs.sendMessage(tab_id, {jacks_link: "huntTimer"}, function (response) {
        if (typeof response === 'undefined') {
            chrome.browserAction.setBadgeText({text: ''});
            notification_done = true;
        } else if (response === "Ready!") {
            if (settings.icon_timer) {
                chrome.browserAction.setBadgeBackgroundColor({color:'#9b7617'});
                chrome.browserAction.setBadgeText({text: '🎺'});
            }
            if (settings.horn_sound && !notification_done) {
                var myAudio = new Audio(sound_file);
                myAudio.play();
            }
            if (settings.horn_alert && !notification_done) {
                chrome.notifications.create(
                    "Jacks MH Horn",
                    {
                        type: "basic",
                        iconUrl: "images/icon128.png",
                        title: "Jack's MH Tools",
                        message: "MouseHunt Horn is ready!!! Good luck!"
                    }
                );
            }
            notification_done = true;
        } else if (response === "King's Reward") {
            if (settings.icon_timer) {
                chrome.browserAction.setBadgeBackgroundColor({color:'#F00'});
                chrome.browserAction.setBadgeText({text: 'KR'});
            }
            notification_done = true;
        } else {
            if (settings.icon_timer) {
                chrome.browserAction.setBadgeBackgroundColor({color:'#222'});
                response = response.replace(':', '');
                response = parseInt(response);
                if (response > 59) {
                    response = Math.floor(response/100) + 'm';
                } else {
                    response += 's';
                }
                chrome.browserAction.setBadgeText({text: response});
            } else { // reset in case user turns icon_timer off
                chrome.browserAction.setBadgeText({text: ''});
            }
            notification_done = false;
        }
    });
}
