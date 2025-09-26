import {LoggerService} from "@scripts/services/logging";
import {BackgroundMessageHandler} from "@scripts/services/message-handler/background-message-handler";
import {ExtensionLogBackgroundExtensionMessageHandlers, ExtensionLogExtensionMessage, ExtensionLogMessages} from "./extension-log.types";

export class ExtensionLogBackground extends BackgroundMessageHandler<
    ExtensionLogExtensionMessage,
    ExtensionLogBackgroundExtensionMessageHandlers
> {
    protected readonly messageNamespace = "extensionLog";

    protected readonly messageHandlers: ExtensionLogBackgroundExtensionMessageHandlers = {
        [ExtensionLogMessages.ExtensionLog]: ({message}) => this.handleExtensionLog(message),
    };

    constructor(logger: LoggerService) {
        super(logger);
    }

    private async handleExtensionLog(
        message: ExtensionLogExtensionMessage
    ): Promise<void> {
        this.logger.log(message.level, message.message, ...(message.args ?? []));

        return Promise.resolve();
    }
}
