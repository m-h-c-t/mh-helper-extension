import type { Messenger } from '@scripts/content/messaging/messenger';
import type { LogLevel } from '@scripts/services/logging';

import { ForegroundMessageHandler } from '@scripts/services/message-handler/foreground-message-handler';

import type { ExtensionLogExtensionMessage } from './extension-log.types';

import { ExtensionLogMessages } from './extension-log.types';

/**
 * Extension Log module to send log messages from the foreground to the background.
 *
 * Useful for having semi-persistent logs that can be viewed in the background page
 */
export class ExtensionLog extends ForegroundMessageHandler<ExtensionLogExtensionMessage> {
    constructor(
        messenger: Messenger
    ) {
        super(messenger);
    }

    async log(level: LogLevel, message: unknown, ...args: unknown[]) {
        const payload: ExtensionLogExtensionMessage = {
            command: ExtensionLogMessages.ExtensionLog,
            level,
            message,
            args
        };

        await this.request(payload);
    }
}
