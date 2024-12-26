// Alarm to handle periodic updates for the badge text
chrome.alarms.create('updateBadge', {periodInMinutes: 1 / 60}); // every minute, as frequently as possible

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'updateBadge') {
        check_settings(icon_timer_find_open_mh_tab);
    }
});

// Update check
chrome.runtime.onUpdateAvailable.addListener(details => {
    console.log(`MHHH: updating to version ${details.version}`);
    chrome.runtime.reload();
});

// Refresh MH pages when a new version is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query(
        {'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']},
        tabs => tabs.forEach(tab => chrome.tabs.reload(tab.id))
    );
});

/**
 * Retrieve and check current settings
 * @param {Function} callback
 */
function check_settings(callback) {
    chrome.storage.sync.get({
        message_display: 'hud',
        success_messages: true,
        error_messages: true,
        icon_timer: true,
        horn_sound: false,
        custom_sound: '',
        horn_volume: 100,
        horn_alert: false,
        horn_webalert: false,
        horn_popalert: false,
        tracking_enabled: true,
        dark_mode: false,
    }, settings => callback(settings));
}

/**
 * Update the badge text icon timer based on the latest settings and current MH page.
 * @param {Object} settings
 */
function icon_timer_find_open_mh_tab(settings) {
    chrome.tabs.query(
        {'url': ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']},
        (found_tabs) => {
            const [mhTab] = found_tabs;
            if (mhTab && (!mhTab.status || mhTab.status === "complete")) {
                icon_timer_updateBadge(mhTab.id, settings);
            } else {
                icon_timer_updateBadge(false, settings);
            }
        }
    );
}

// Notification settings and default sound
const default_sound = chrome.runtime.getURL('sounds/bell.mp3');
let notification_done = false;

/**
 * Badge icon timer update based on settings and MH page response
 * @param {number|boolean} tab_id - The MH tab's ID, or `false` if no MH page is open & loaded.
 * @param {Object} settings - Extension settings
 */
function icon_timer_updateBadge(tab_id, settings) {
    if (tab_id === false) {
        chrome.action.setBadgeText({text: ''});
        notification_done = false; // reset notification status if no MH page is open
        return;
    }

    // Query the MH page and update the badge based on the response
    const request = {mhct_link: "huntTimer"};
    chrome.tabs.sendMessage(tab_id, request, response => {
        if (chrome.runtime.lastError || !response) {
            console.log("Error or no response updating badge:", chrome.runtime.lastError?.message || "");
            chrome.action.setBadgeText({text: ''});
            notification_done = true;
        } else if (response === "Ready") {
            if (settings.icon_timer) {
                chrome.action.setBadgeBackgroundColor({color: '#9b7617'});
                chrome.action.setBadgeText({text: '🎺'});
            }
            // Send notifications if not already done
            if (!notification_done) {
                trigger_notifications(settings, tab_id);
                notification_done = true; // Set the flag to true after triggering notifications
            }
        } else if (["King's Reward", "Logged out"].includes(response)) {
            chrome.action.setBadgeBackgroundColor({color: '#F00'});
            chrome.action.setBadgeText({text: 'RRRRRRR'});
            notification_done = true;
        } else {
            // Update the badge with the remaining time before the next horn
            notification_done = false;
            if (settings.icon_timer) {
                chrome.action.setBadgeBackgroundColor({color: '#222'});
                const timeText = formatBadgeText(response);
                chrome.action.setBadgeText({text: timeText});
            } else {
                chrome.action.setBadgeText({text: ''});
            }
        }
    });
}

/**
 * Formats response time for badge display
 * @param {string} response - Time response from the MH page
 * @returns {string} - Formatted text for the badge
 */
function formatBadgeText(response) {
    response = response.replace(':', '');
    let timeText = '';
    const response_int = parseInt(response, 10);
    if (response.includes('min')) {
        timeText = response_int + 'm';
    } else {
        if (response_int > 59) {
            let minutes = Math.floor(response_int / 100);
            const seconds = response_int % 100;
            if (seconds > 30) {
                ++minutes;
            }
            timeText = minutes + 'm';
        } else {
            timeText = response_int + 's';
        }
    }
    return timeText;
}

/**
 * Triggers notifications based on settings when the horn is ready
 * @param {Object} settings - Extension settings
 * @param {number} tab_id - The MH tab's ID
 */
function trigger_notifications(settings, tab_id) {
    if (settings.horn_sound && settings.horn_volume > 0) {
        const audio = new Audio(settings.custom_sound || default_sound);
        audio.volume = settings.horn_volume / 100;
        audio.play();
    }
    if (settings.horn_alert) {
        chrome.notifications.create("MHCT Horn", {
            type: "basic",
            iconUrl: "images/icon128.png",
            title: "MHCT Tools",
            message: "MouseHunt Horn is ready!!! Good luck!",
        });
    }
    if (settings.horn_webalert) {
        chrome.tabs.update(tab_id, {active: true});
        chrome.tabs.sendMessage(tab_id, {mhct_link: "show_horn_alert"});
    }
    if (settings.horn_popalert) {
        if (confirm("MouseHunt Horn is Ready! Sound it now?")) {
            chrome.tabs.sendMessage(tab_id, {mhct_link: "horn"});
        }
    }
}

// Handle messages sent by the extension to the runtime.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
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
    // TODO: Handle other extension messages.
});

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
