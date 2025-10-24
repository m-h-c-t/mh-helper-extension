export type TurnState = {
    success: true;
    lastTurnTimestamp: number; // in seconds
    turnWaitSeconds: number;
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
