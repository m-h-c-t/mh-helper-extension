export type TurnState = {
    success: true;
    nextActiveTurnSeconds: number;
    updatedAt: number; // Timestamp in milliseconds when this state was captured
} | {
    success: false;
    error: 'King\'s Reward' | 'Logged out' | 'Unknown';
};

export interface BadgeTimerProtocolMap {
    getTimeLeft(): number;
    sendTurnState(turnState: TurnState): void;
    sendLoggedOut(): void;
    playSound(sound: {url: string, volume: number}): void;
    soundHorn(): void;
    confirmHorn(): void;
}
