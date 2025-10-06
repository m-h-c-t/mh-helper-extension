import type { LoggerService } from '@scripts/services/logging';

import { defineExtensionMessaging } from '@webext-core/messaging';

import type { ExtensionLogData, ExtensionLogProtocolMap } from './extension-log.types';

export const extensionLogExtensionMessenger = defineExtensionMessaging<ExtensionLogProtocolMap>();

export class ExtensionLogBackground {
    constructor(
        private readonly logger: LoggerService
    ) { }

    protected readonly messageNamespace = 'extensionLog';
    init() {
        extensionLogExtensionMessenger.onMessage('log', (message) => {
            this.handleLog(message.data);
        });
    }

    private handleLog(data: ExtensionLogData) {
        this.logger.log(data.level, data.message, ...(data.args ?? []));
    }
}
