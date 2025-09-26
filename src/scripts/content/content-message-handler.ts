import {MessageTypes} from "./messaging/message";
import {MessageWithMetadata, Messenger} from "./messaging/messenger";

/**
 * This class will handle messages from the web page and forward them to the background script.
 */

const messenger = Messenger.forDOMCommunication(globalThis.window);
messenger.handler = handleWindowMessage;

function handleWindowMessage(
    message: MessageWithMetadata,
    abortController?: AbortController
) {
    if (message.type === MessageTypes.RuntimeMessage) {
        void sendExtensionMessage(message.data);
    }

    return;
}

async function sendExtensionMessage(data: unknown) {
    await chrome.runtime.sendMessage(data);
}
