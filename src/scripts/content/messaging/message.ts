export const MessageTypes = {
    RuntimeMessage: 0,
    AbortRequest: 1,
    DisconnectRequest: 2,
    ReconnectRequest: 3,
    AbortResponse: 4,
    ErrorResponse: 5,
} as const;

export type MessageType = (typeof MessageTypes)[keyof typeof MessageTypes];

export interface RuntimeMessage {
    type: typeof MessageTypes.RuntimeMessage;
    data: unknown;
}

export interface AbortRequest {
    type: typeof MessageTypes.AbortRequest;
    abortedRequestId: string;
}

export interface DisconnectRequest {
    type: typeof MessageTypes.DisconnectRequest;
}

export interface ReconnectRequest {
    type: typeof MessageTypes.ReconnectRequest;
}

export interface ErrorResponse {
    type: typeof MessageTypes.ErrorResponse;
    error: string;
}

export interface AbortResponse {
    type: typeof MessageTypes.AbortResponse;
    abortedRequestId: string;
}

export type Message =
    | RuntimeMessage
    | AbortRequest
    | DisconnectRequest
    | ReconnectRequest
    | AbortResponse
    | ErrorResponse;
