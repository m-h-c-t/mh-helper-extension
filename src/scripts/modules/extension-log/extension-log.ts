import type { LogLevel } from '@scripts/services/logging';

import { defineWindowMessaging } from '@webext-core/messaging/page';

import type { ExtensionLogProtocolMap } from './extension-log.types';

export const extensionLogWindowMessenger = defineWindowMessaging<ExtensionLogProtocolMap>({
    namespace: 'mhct-helper-extension_extension-log',
});

/**
 * Extension Log module to send log messages from the foreground to the background.
 *
 * Useful for having semi-persistent logs that can be viewed in the background page
 */
export class ExtensionLog {
    async log(level: LogLevel, message: unknown, ...args: unknown[]) {
        await extensionLogWindowMessenger.sendMessage('log', {level, message, args});
    }
}
