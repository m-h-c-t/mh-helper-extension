import { badgeTimerWindowMessenger } from '@scripts/modules/badge-timer/badge-timer';
import { badgeTimerExtensionMessenger } from '@scripts/modules/badge-timer/badge-timer.background';
import { crownTrackerWindowMessenger } from '@scripts/modules/crown-tracker/crown-tracker';
import { crownTrackerExtensionMessenger } from '@scripts/modules/crown-tracker/crown-tracker.background';
import { extensionLogWindowMessenger } from '@scripts/modules/extension-log/extension-log';
import { extensionLogExtensionMessenger } from '@scripts/modules/extension-log/extension-log.background';

crownTrackerWindowMessenger.onMessage('submitCrowns', async (message) => {
    return await crownTrackerExtensionMessenger.sendMessage('submitCrowns', message.data);
});

extensionLogWindowMessenger.onMessage('log', async (message) => {
    return await extensionLogExtensionMessenger.sendMessage('log', message.data);
});

badgeTimerWindowMessenger.onMessage('sendTurnState', async (message) => {
    return await badgeTimerExtensionMessenger.sendMessage('sendTurnState', message.data);
});
badgeTimerWindowMessenger.onMessage('sendLoggedOut', async (message) => {
    return await badgeTimerExtensionMessenger.sendMessage('sendLoggedOut', message.data);
});

badgeTimerExtensionMessenger.onMessage('playSound', async (message) => {
    return await badgeTimerWindowMessenger.sendMessage('playSound', message.data);
});
badgeTimerExtensionMessenger.onMessage('soundHorn', async (message) => {
    return await badgeTimerWindowMessenger.sendMessage('soundHorn', message.data);
});
badgeTimerExtensionMessenger.onMessage('confirmHorn', async (message) => {
    return await badgeTimerWindowMessenger.sendMessage('confirmHorn', message.data);
});

// TODO: Uncomment
/*
// Simulate the internals of webext-core to automatically forward messages from the page to the background script
const REQUEST_TYPE = '@webext-core/messaging/window';
const RESPONSE_TYPE = '@webext-core/messaging/window/response';

// eslint-disable-next-line @typescript-eslint/no-misused-promises
window.addEventListener('message', async (event) => {
    if (event.data?.type === REQUEST_TYPE) {
        const response = await chrome.runtime.sendMessage(event.data.message);
        window.postMessage(
            {type: RESPONSE_TYPE, response, instanceid: event.data.instanceId, message: event.data.message, namespace: event.data.namespace},
            event.data.senderOrigin
        );
    }
});
*/
