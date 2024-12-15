/** Persistent background script.
 * MAYBE: Migrate to non-persistent, event-based background script.
 * info: https://developer.chrome.com/extensions/background_migration
 */

// Update check
chrome.runtime.onUpdateAvailable.addListener(details => {
    console.log(`MHHH: updating to version ${details.version}`);
    chrome.runtime.reload();
});

// Refreshes MH pages when new version is installed, to inject the latest extension code.
chrome.runtime.onInstalled.addListener(() => chrome.tabs.query(
    {'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']},
    tabs => tabs.forEach(tab => chrome.tabs.reload(tab.id))
));

setInterval(updateIcon, 1000);

// Set the default user settings, also holds current
let userSettings = {
    version: 1,
    'tracking-hunts': true,
    'tracking-crowns': true,
    'tracking-convertibles': true,
    'tracking-events': true,
    'notification-sound': false,
    'notification-volume': 100,
    'notification-custom': false,
    'notification-custom-url': '',
    'notification-desktop': false,
    'notification-alert-type': 'none',
    'notification-message-display': 'hud',
    'notification-success-messages': true,
    'notification-error-messages': true,
    'enhancement-icon-timer': true,
    'enhancement-tsitu-loader': false,
    'enhancement-tsitu-loader-offset': 80,
    'enhancement-escape-dismiss': false,
    'enhancement-dark-mode': false,
    'general-log-level': 'info',
};

function changeUserSettings(settings) {
    if (settings.value) {
        userSettings = settings.value;
    }

    chrome.storage.sync.set(userSettings);

    return userSettings;
}

function updateIcon() {
    chrome.tabs.query({'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']},
        (found_tabs) => {
            const [mhTab] = found_tabs;
            if (mhTab && (!mhTab.status || mhTab.status === "complete")) {
                icon_timer_updateBadge(mhTab.id);
            } else {
                // The tab was either not found, or is still loading.
                icon_timer_updateBadge(false);
            }
        });
}

// Notifications
const default_sound = chrome.runtime.getURL('sounds/bell.mp3');
let notification_done = false;
/**
 * Scheduled function that sets the badge color & text based on current settings.
 * Modifies the global `notification_done` as appropriate.
 * @param {number|boolean} tab_id The MH tab's ID, or `false` if no MH page is open & loaded.
 */
function icon_timer_updateBadge(tab_id) {
    if (tab_id === false) {
        chrome.browserAction.setBadgeText({text: ''});
        return;
    }

    // Query the MH page and update the badge based on the response.
    const request = {mhct_link: "huntTimer"};
    chrome.tabs.sendMessage(tab_id, request, response => {

        async function showIntrusiveAlert() {
            await new Promise(r => setTimeout(r, 1000));
            chrome.tabs.update(tab_id, {'active': true});
            chrome.tabs.sendMessage(tab_id, {mhct_link: "show_horn_alert"});
        }

        async function showBackgroundAlert() {
            await new Promise(r => setTimeout(r, 1000));
            if (confirm("MouseHunt Horn is Ready! Sound it now?")) {
                chrome.tabs.sendMessage(tab_id, {mhct_link: "horn"});
            }
        }

        if (chrome.runtime.lastError || !response) {
            const logInfo = {tab_id, request, response, time: new Date(),
                message: "Error occurred while updating badge icon timer."};
            if (chrome.runtime.lastError) {
                logInfo.message += `\n${chrome.runtime.lastError.message}`;
            }
            console.log(logInfo);
            chrome.browserAction.setBadgeText({text: ''});
            notification_done = true;
        } else if (response === "Ready") {
            if (userSettings["enhancement-icon-timer"]) {
                chrome.browserAction.setBadgeBackgroundColor({color: '#9b7617'});
                chrome.browserAction.setBadgeText({text: '🎺'});
            }
            // If we haven't yet sent a notification about the horn, do so if warranted.
            if (!notification_done) {
                const volume = userSettings["notification-volume"];
                if (userSettings["notification-sound"] && volume > 0) {
                    let myAudio = new Audio(default_sound);
                    if (userSettings["notification-custom"]) {
                        myAudio = new Audio(userSettings["notification-custom-url"]);
                    }

                    myAudio.volume = (volume / 100).toFixed(2);
                    myAudio.play();
                }

                if (userSettings["notification-desktop"]) {
                    chrome.notifications.create(
                        "MHCT Horn",
                        {
                            type: "basic",
                            iconUrl: "images/icon128.png",
                            title: "MHCT Tools",
                            message: "MouseHunt Horn is ready!!! Good luck!",
                        }
                    );
                }

                switch (userSettings["notification-alert-type"]) {
                    case "background":
                        showBackgroundAlert();
                        break;
                    case "intrusive":
                        showIntrusiveAlert();
                        break;
                }
            }
            notification_done = true;
        } else if (["King's Reward", "Logged out"].includes(response)) {
            if (userSettings["enhancement-icon-timer"]) {
                chrome.browserAction.setBadgeBackgroundColor({color: '#F00'});
                chrome.browserAction.setBadgeText({text: 'RRRRRRR'});
            }
            notification_done = true;
        } else {
            // The user is logged in, has no KR, and the horn isn't ready yet. Set
            // the badge text to the remaining time before the next horn.
            notification_done = false;
            if (userSettings["enhancement-icon-timer"]) {
                chrome.browserAction.setBadgeBackgroundColor({color: '#222'});
                response = response.replace(':', '');
                const response_int = parseInt(response, 10);
                if (response.includes('min')) {
                    response = response_int + 'm';
                } else {
                    if (response_int > 59) {
                        let minutes = Math.floor(response_int / 100);
                        const seconds = response_int % 100;
                        if (seconds > 30) {
                            ++minutes;
                        }
                        response = minutes + 'm';
                    } else {
                        response = response_int + 's';
                    }
                }
            } else { // reset in case user turns icon_timer off
                response = "";
            }
            chrome.browserAction.setBadgeText({text: response});
        }
    });
}

// Handle messages sent by the extension to the runtime.
function onMessage(msg, sender, sendResponse) {
    // Check the message for something to log in the background's console.
    if (msg.log) {
        let fn = console.log;
        if (msg.log.is_error) {
            fn = console.error;
        } else if (msg.log.is_warning) {
            fn = console.warn;
        }
        fn({message: msg.log, sender});
    } else if (msg.settings?.debug_logging) {
        console.log({msg, msg_sender: sender});
    }

    // If responding asynchronously, return `true` to keep the port open.
    if (msg.mhct_crown_update === 1) {
        submitCrowns(msg.crowns).then(sendResponse);
        return true;
    }

    let response;
    switch (msg.what) {
        case 'userSettings':
            response = changeUserSettings(msg);
            break;
    }

    sendResponse(response);
}

chrome.runtime.onMessage.addListener(onMessage);

/**
 * Promise to submit the given crowns for external storage (e.g. for MHCC or others)
 * @param {Object <string, any>} crowns Crown counts for the given user
 * @returns {Promise <number | boolean>} A promise that resolves with the submitted crowns, or `false` otherwise.
 */
async function submitCrowns(crowns) {
    if (!crowns?.user || (crowns.bronze + crowns.silver + crowns.gold + crowns.platinum + crowns.diamond) === 0) {
        return false;
    }

    const hash = ['bronze', 'silver', 'gold', 'platinum', 'diamond'].map((type) => crowns[type]).join(',');
    if (window.sessionStorage.getItem(crowns.user) === hash) {
        window.console.log(`Skipping submission for user "${crowns.user}" (already sent).`);
        return null;
    }

    const endpoint = 'https://script.google.com/macros/s/AKfycbztymdfhwOe4hpLIdVLYCbOTB66PWNDtnNRghg-vFx5u2ogHmU/exec';
    const options = {
        mode: 'cors',
        method: 'POST',
        credentials: 'omit',
    };

    const payload = new FormData();
    payload.set('main', JSON.stringify(crowns));
    try {
        const resp = await fetch(endpoint, {...options, body: payload});
        if (!resp.ok) return false;
    } catch (error) {
        window.console.error('Fetch/Network Error', {error, crowns});
        return false;
    }

    // Cache when we've successfully posted to the endpoint.
    try {
        window.sessionStorage.setItem(crowns.user, hash);
    } catch (error) {
        window.console.warn('Unable to cache crown request');
    }
    setTimeout(() => window.sessionStorage.removeItem(crowns.user), 300 * 1000);
    return crowns.bronze + crowns.silver + crowns.gold + crowns.platinum + crowns.diamond;
}

// TODO: Clean up into a separate file

async function migrateUserSettings() {
    const defaults = userSettings;

    const results = await new Promise(resolve => chrome.storage.sync.get(null, resolve));

    if (!(results instanceof Object)) {
        return;
    }

    const version = results.version || 0;

    // settings didn't have version field, so it's likely the old format
    if (version === 0 && Object.keys(results).length > 0) {
        // tracking
        defaults['tracking-hunts'] = results.tracking_enabled;
        defaults['tracking-crowns'] = results.tracking_enabled;

        // notification
        defaults['notification-sound'] = results.horn_sound;
        defaults['notification-volume'] = results.horn_volume;
        defaults['notification-custom'] = results.custom_sound !== '';
        defaults['notification-custom-url'] = results.custom_sound;
        defaults['notification-desktop'] = results.horn_alert;
        const instrusive = results.horn_webalert;
        const background = results.horn_popalert;

        if (!instrusive && !background) {
            defaults['notification-alert-type'] = 'none';
        } else if (instrusive) {
            defaults['notification-alert-type'] = 'intrusive';
        } else if (background) {
            defaults['notification-alert-type'] = 'background';
        }

        defaults['notification-message-display'] = results.message_display;
        defaults['notification-success-messages'] = results.success_messages;
        defaults['notification-error-messages'] = results.error_messages;

        // enhancement
        defaults['enhancement-icon-timer'] = results.icon_timer;
        defaults['enhancement-tsitu-loader'] = results.tsitu_loader_on;
        defaults['enhancement-tsitu-loader-offset'] = results.tsitu_loader_offset;
        defaults['enhancement-escape-dismiss'] = results.escape_button_close;
        defaults['enhancement-dark-mode'] = results.dark_mode;

        chrome.storage.sync.clear();
        chrome.storage.sync.set(defaults);
    }

    userSettings = defaults;
}

async function loadUserSettings() {
    await migrateUserSettings();

    const defaults = userSettings;
    const results = await new Promise(resolve => chrome.storage.sync.get(Object.assign(defaults), resolve));
    const newSettings = results instanceof Object && results || Object.assign(defaults);

    userSettings = newSettings;
}

(async () => {

    try {
        await loadUserSettings();
    } catch (e) {
        console.trace(e);
    }

})();
