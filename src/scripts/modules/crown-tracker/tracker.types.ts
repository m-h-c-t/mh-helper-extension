import {MessageHandlerRegistry, MessageHandlerParams} from "@scripts/services/message-handler/background-message-handler";

export const CrownTrackerMessages = {
    CrownTrackerSubmit: 'crownTrackerSubmit',
} as const;

export type CrownTrackerMessageType = (typeof CrownTrackerMessages)[keyof typeof CrownTrackerMessages];

export const Crowns = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;

export type CrownType = (typeof Crowns)[number];

export interface CrownData {
    user: string;
    crowns: Record<CrownType, number>;
}

export type CrownTrackerExtensionMessage = {
    [key: string]: unknown;
    command: CrownTrackerMessageType;
} & CrownData;

export interface CrownTrackerBackgroundExtensionMessageHandlers extends MessageHandlerRegistry<CrownTrackerExtensionMessage> {
    [CrownTrackerMessages.CrownTrackerSubmit]: (params: MessageHandlerParams<CrownTrackerExtensionMessage>) => Promise<void>;
}
