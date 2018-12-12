// Update check
chrome.runtime.onUpdateAvailable.addListener(details => {
    console.log("MHHH: updating to version " + details.version);
    chrome.runtime.reload();
});

var time_interval = 7200 * 1000; // seconds * 1000
window.setInterval(() => chrome.runtime.requestUpdateCheck(status => {
        if (status == "update_available") {
            console.log("MHHH: update pending...");
        } else if (status == "no_update") {
            console.log("MHHH: no update found");
        } else if (status == "throttled") {
            console.log("MHHH: Oops, update check failed.");
        }
    }),
time_interval);

// Refreshes mh pages when new version is installed
chrome.runtime.onInstalled.addListener(details => chrome.tabs.query(
    {'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']},
    tabs => tabs.forEach(tab => chrome.tabs.reload(tab.id))
));

// icon_timer, horn_sound and horn_alert
var sound_file = chrome.extension.getURL('sounds/bell.mp3');
var notification_done = false;
setInterval(() => check_settings(icon_timer_find_open_mh_tab), 1000);


function check_settings(callback) {
    chrome.storage.sync.get({
        success_messages: true, // defaults
        error_messages: true, // defaults
        icon_timer: true, // defaults
        horn_sound: false, // defaults
        custom_sound: '', // defaults
        horn_volume: 100, // defaults
        horn_alert: false, // defaults
        horn_webalert: false, // defaults
        track_crowns: true // defaults
    },
    settings => callback(settings));
}

function icon_timer_find_open_mh_tab(settings) {
    chrome.tabs.query({'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']},
    found_tabs => {
        if (found_tabs.length > 0) {
            icon_timer_updateBadge(found_tabs[0].id, settings);
        } else {
            icon_timer_updateBadge(false, settings);
        }
    });
}

// Notifications
function icon_timer_updateBadge(tab_id, settings) {
    if (tab_id === false) {
        chrome.browserAction.setBadgeText({text: ''});
        return;
    }

    chrome.tabs.sendMessage(tab_id, {jacks_link: "huntTimer"}, response => {
        if (typeof response === 'undefined') {
            chrome.browserAction.setBadgeText({text: ''});
            notification_done = true;
        } else if (response === "Ready!") {
            if (settings.icon_timer) {
                chrome.browserAction.setBadgeBackgroundColor({color: '#9b7617'});
                chrome.browserAction.setBadgeText({text: '🎺'});
            }
            if (settings.horn_sound && !notification_done) {
                let myAudio = new Audio(settings.custom_sound || sound_file);
                myAudio.volume = (settings.horn_volume / 100).toFixed(2);
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
            if (settings.horn_webalert && !notification_done) {
                chrome.tabs.update(tab_id, {'active': true});
                chrome.tabs.sendMessage(tab_id, {jacks_link: "show_horn_alert"});
            }
            notification_done = true;
        } else if (["King's Reward", "Logged out"].includes(response)) {
            if (settings.icon_timer) {
                chrome.browserAction.setBadgeBackgroundColor({color: '#F00'});
                chrome.browserAction.setBadgeText({text: 'RRRRRRR'});
            }
            notification_done = true;
        } else {
            if (settings.icon_timer) {
                chrome.browserAction.setBadgeBackgroundColor({color: '#222'});
                response = response.replace(':', '');
                let response_int = parseInt(response);
                if (response.includes('min')) {
                    response = response_int + 'm';
                } else {
                    if (response_int > 59) {
                        response = Math.floor(response_int / 100) + 'm';
                    } else {
                        response = response_int + 's';
                    }
                }

                chrome.browserAction.setBadgeText({text: response});
            } else { // reset in case user turns icon_timer off
                chrome.browserAction.setBadgeText({text: ''});
            }
            notification_done = false;
        }
    });
}
