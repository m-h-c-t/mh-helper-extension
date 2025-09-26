import {Messenger} from "@scripts/content/messaging/messenger";
import {ExtensionMessage} from "./background-message-handler";
import {MessageTypes} from "@scripts/content/messaging/message";

export abstract class ForegroundMessageHandler<
    TMessage extends ExtensionMessage
> {

    constructor(
        private readonly messenger: Messenger
    ) { }

    protected async request(message: TMessage): Promise<unknown> {
        return await this.messenger.request({
            type: MessageTypes.RuntimeMessage,
            data: message,
        });
    }
}
