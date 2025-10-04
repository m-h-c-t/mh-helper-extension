/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import type { UserSettings } from './services/settings/settings.service';

import MainBackground from './background/main.background';
import { ConsoleLogger } from './services/logging';

const logger = new ConsoleLogger(false);
const mhctMain = ((self as any).mhctMain = new MainBackground());
mhctMain.bootstrap().then(startHeartbeat)
    .catch(error => logger.error(error));

async function runHeartbeat() {
    await chrome.runtime.getPlatformInfo();
}

/**
 * Starts the heartbeat interval which keeps the service worker alive.
 */
async function startHeartbeat() {
    await runHeartbeat();
    setInterval(() => { void runHeartbeat(); }, 20 * 1000);
}

// Old background script for the extension.
setInterval(() => { void updateIcon(); }, 1000);

async function updateIcon() {
    const found_tabs = await chrome.tabs.query({url: ['*://www.mousehuntgame.com/*', '*://apps.facebook.com/mousehunt/*']});
    const [mhTab] = found_tabs;
    if (mhTab && (!mhTab.status || mhTab.status === 'complete')) {
        await icon_timer_updateBadge(mhTab.id);
    } else {
        // The tab was either not found, or is still loading.
        await icon_timer_updateBadge(false);
    }
}

// Notifications
const default_sound = chrome.runtime.getURL('sounds/bell.mp3');
let notification_done = false;
/**
 * Scheduled function that sets the badge color & text based on current settings.
 * Modifies the global `notification_done` as appropriate.
 * @param {number|boolean} tab_id The MH tab's ID, or `false` if no MH page is open & loaded.
 */
async function icon_timer_updateBadge(tab_id: number | false | undefined) {
    if (tab_id === false || tab_id === undefined) {
        await chrome.action.setBadgeText({text: ''});
        return;
    }

    // Query the MH page and update the badge based on the response.
    const request = {mhct_link: 'huntTimer'};
    let response: any;
    try {
        response = await chrome.tabs.sendMessage(tab_id, request);
    } catch (error) {
        logger.error('Error while updating badge icon timer.', {
            tab_id, request, response, time: new Date(), error
        });
        notification_done = true;
    }

    async function showIntrusiveAlert(tabId: number) {
        await new Promise(r => setTimeout(r, 1000));
        await chrome.tabs.update(tabId, {active: true});
        await chrome.tabs.sendMessage(tabId, {mhct_link: 'show_horn_alert'});
    }

    async function showBackgroundAlert(tabId: number) {
        await new Promise(r => setTimeout(r, 1000));
        if (confirm('MouseHunt Horn is Ready! Sound it now?')) {
            await chrome.tabs.sendMessage(tabId, {mhct_link: 'horn'});
        }
    }

    if (chrome.runtime.lastError ?? !response) {
        const logInfo = {tab_id, request, response, time: new Date(),
            message: 'Error occurred while updating badge icon timer.'};
        if (chrome.runtime.lastError) {
            logInfo.message += `\n${chrome.runtime.lastError.message}`;
        }
        console.log(logInfo);
        await chrome.action.setBadgeText({text: ''});
        notification_done = true;
    } else if (response === 'Ready') {
        if (await mhctMain.settingsService.get('enhancement-icon-timer')) {
            await chrome.action.setBadgeBackgroundColor({color: '#9b7617'});
            await chrome.action.setBadgeText({text: '🎺'});
        }
        // If we haven't yet sent a notification about the horn, do so if warranted.
        if (!notification_done) {
            let alertUrl = default_sound;
            const volume = await mhctMain.settingsService.get('notification-volume');
            if (await mhctMain.settingsService.get('notification-sound') && volume > 0) {
                if (await mhctMain.settingsService.get('notification-custom')) {
                    alertUrl = await mhctMain.settingsService.get('notification-custom-url');
                }

                const message = {
                    mhct_link: 'makenoise',
                    volume: volume,
                    sound_url: alertUrl,
                };
                await chrome.tabs.sendMessage(tab_id, message);
            }

            if (await mhctMain.settingsService.get('notification-desktop')) {
                await chrome.notifications.create(
                    'MHCT Horn',
                    {
                        type: 'basic',
                        iconUrl: chrome.runtime.getURL('images/icon128.png'),
                        title: 'MHCT Tools',
                        message: 'MouseHunt Horn is ready!!! Good luck!',
                    }
                );
            }

            switch (await mhctMain.settingsService.get('notification-alert-type')) {
                case 'background':
                    await showBackgroundAlert(tab_id);
                    break;
                case 'intrusive':
                    await showIntrusiveAlert(tab_id);
                    break;
            }
        }
        notification_done = true;
    } else if (['King\'s Reward', 'Logged out'].includes(response)) {
        if (await mhctMain.settingsService.get('enhancement-icon-timer')) {
            await chrome.action.setBadgeBackgroundColor({color: '#F00'});
            await chrome.action.setBadgeText({text: 'RRRRRRR'});
        }
        notification_done = true;
    } else {
        // The user is logged in, has no KR, and the horn isn't ready yet. Set
        // the badge text to the remaining time before the next horn.
        notification_done = false;
        if (await mhctMain.settingsService.get('enhancement-icon-timer')) {
            await chrome.action.setBadgeBackgroundColor({color: '#222'});
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
            response = '';
        }
        await chrome.action.setBadgeText({text: response});
    }
}

// Handle messages sent by the extension to the runtime.
function onMessage(msg: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
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
        void submitCrowns(msg.crowns).then(sendResponse);
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
async function submitCrowns(crowns: Record<string, any>): Promise<number | boolean | null> {
    if (!crowns?.user || (crowns.bronze + crowns.silver + crowns.gold + crowns.platinum + crowns.diamond) === 0) {
        return false;
    }

    const hash = ['bronze', 'silver', 'gold', 'platinum', 'diamond'].map(type => crowns[type]).join(',');
    if (window.sessionStorage.getItem(crowns.user) === hash) {
        window.console.log(`Skipping submission for user "${crowns.user}" (already sent).`);
        return null;
    }

    const endpoint = 'https://script.google.com/macros/s/AKfycbztymdfhwOe4hpLIdVLYCbOTB66PWNDtnNRghg-vFx5u2ogHmU/exec';
    const options: RequestInit = {
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
    } catch {
        window.console.warn('Unable to cache crown request');
    }
    setTimeout(() => window.sessionStorage.removeItem(crowns.user), 300 * 1000);
    return crowns.bronze + crowns.silver + crowns.gold + crowns.platinum + crowns.diamond;
}

/** Settings */
async function changeUserSettings(settings: {value: Partial<UserSettings>}) {
    if (!settings?.value) {
        return;
    }

    for (const [key, value] of Object.entries(settings.value)) {
        await mhctMain.settingsService.set(key as keyof UserSettings, value);
    }
}
