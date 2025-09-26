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

export interface BackgroundOnMessageHandlerParams {
    message: CrownTrackerExtensionMessage;
    sender: chrome.runtime.MessageSender;
}

export interface CrownTrackerBackgroundExtensionMessageHandlers {
    [key: string]: CallableFunction;
    crownTrackerSubmit: ({message, sender}: BackgroundOnMessageHandlerParams) => Promise<void>;
}
