export type TurnState = {
    success: true;
    timeLeft: number; // in seconds
} | {
    success: false;
    error: 'King\'s Reward' | 'Logged out' | 'Unknown';
};

export interface BadgeTimerProtocolMap {
    getTurnState(): TurnState;
    playSound(sound: {url: string, volume: number}): void;
    soundHorn(): void;
    confirmHorn(): void;
}
