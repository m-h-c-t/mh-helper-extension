import type { LoggerService } from '@scripts/services/logging';

import { BrowserApi } from '@scripts/services/browser/browser-api';

/**
 * Generic extension message structure that all background handlers must implement
 */
export interface ExtensionMessage {
    [key: string]: unknown;
    command: string;
}

/**
 * Parameters passed to message handler functions
 */
export interface MessageHandlerParams<TMessage extends ExtensionMessage> {
    message: TMessage;
    sender: chrome.runtime.MessageSender;
}

/**
 * Type for message handler functions
 */
export type MessageHandler<TMessage extends ExtensionMessage, TResult = unknown> = (
    params: MessageHandlerParams<TMessage>
) => Promise<TResult> | TResult;

/**
 * Registry of message handlers keyed by command
 */
export type MessageHandlerRegistry<TMessage extends ExtensionMessage> = Record<string, MessageHandler<TMessage>>;

/**
 * Abstract base class for background modules that handle extension messages.
 *
 * This class provides a common pattern for:
 * - Registering message listeners with BrowserApi
 * - Routing messages to appropriate handlers based on command
 * - Error handling and response management
 * - Promise-based async message handling
 *
 * @template TMessage - The specific extension message type this handler processes
 * @template THandlers - The message handler registry type for this handler
 */
export abstract class BackgroundMessageHandler<
    TMessage extends ExtensionMessage,
    THandlers extends MessageHandlerRegistry<TMessage>
> {
    /**
     * Registry of message handlers keyed by command name
     * Must be implemented by concrete classes
     */
    protected abstract readonly messageHandlers: THandlers;

    /**
     * The namespace for this message handler used for BrowserApi registration
     * Must be implemented by concrete classes
     */
    protected abstract readonly messageNamespace: string;

    constructor(
        protected readonly logger: LoggerService
    ) { }

    /**
     * Initialize the background message handler.
     * Registers the message listener with BrowserApi using the specified namespace.
     *
     * @returns Promise that resolves when initialization is complete
     */
    async init(): Promise<void> {
        BrowserApi.messageListener(this.messageNamespace, this.handleMessage);

        await this.initialize();
    }

    protected initialize(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Handle incoming extension messages by routing to appropriate handler.
     *
     * This method:
     * 1. Looks up the handler based on message command
     * 2. Calls the handler if found
     * 3. Handles async responses and error handling
     * 4. Returns appropriate response to extension runtime
     *
     * @param message - The extension message received
     * @param sender - Chrome runtime sender information
     * @param sendResponse - Callback to send response back to sender
     * @returns true if message was handled, false otherwise
     */
    private handleMessage = (
        message: TMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
    ): boolean => {
        const handler = this.messageHandlers[message?.command];
        if (!handler) {
            return false;
        }

        try {
            // Call the handler with standardized parameters
            const messageResponse = handler({message, sender});

            if (typeof messageResponse === 'undefined') {
                return false;
            }

            // Handle both sync and async responses
            Promise.resolve(messageResponse)
                .then(response => sendResponse(response))
                .catch((error) => {
                    this.logger.error(
                        `Error handling extension message for command '${message.command}'`,
                        error
                    );
                    sendResponse(undefined);
                });
        } catch (error) {
            this.logger.error(
                `Synchronous error handling extension message for command '${message.command}'`,
                error
            );
            sendResponse(undefined);
        }

        return true;
    };
}
