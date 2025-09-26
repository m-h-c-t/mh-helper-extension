import {LogLevel} from "@scripts/services/logging";
import {MessageHandlerRegistry, MessageHandlerParams} from "@scripts/services/message-handler/background-message-handler";

export const ExtensionLogMessages = {
    ExtensionLog: 'extensionLog',
} as const;

export type ExtensionLogMessageType = (typeof ExtensionLogMessages)[keyof typeof ExtensionLogMessages];

export interface ExtensionLogData {
    level: LogLevel;
    message: unknown;
    args?: unknown[];
}

export type ExtensionLogExtensionMessage = {
    [key: string]: unknown;
    command: ExtensionLogMessageType;
} & ExtensionLogData;

export interface ExtensionLogBackgroundExtensionMessageHandlers extends MessageHandlerRegistry<ExtensionLogExtensionMessage> {
    [ExtensionLogMessages.ExtensionLog]: (params: MessageHandlerParams<ExtensionLogExtensionMessage>) => Promise<void>;
}
