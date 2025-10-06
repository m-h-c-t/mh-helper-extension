import { HornHud } from '@scripts/util/hornHud';
import { defineWindowMessaging } from '@webext-core/messaging/page';

import type { BadgeTimerProtocolMap, TurnState } from './badge-timer.types';

export const badgeTimerWindowMessenger = defineWindowMessaging<BadgeTimerProtocolMap>({
    namespace: 'mhct-helper-extension_badgeTimer',
});

export class BadgeTimer {
    init() {
        badgeTimerWindowMessenger.onMessage('getTurnState', () => {
            return this.getTurnState();
        });
        badgeTimerWindowMessenger.onMessage('playSound', (message) => {
            return this.playSound(message.data);
        });
        badgeTimerWindowMessenger.onMessage('soundHorn', () => {
            return this.soundHorn();
        });
        badgeTimerWindowMessenger.onMessage('confirmHorn', () => {
            return this.confirmHorn();
        });
    }

    private getTurnState(): TurnState {
        if (user.has_puzzle) {
            return {
                success: false,
                error: 'King\'s Reward'
            };
        } else {
            const timerText = HornHud.getTimerText();
            if (timerText == null) {
                return {
                    success: false,
                    error: 'Unknown'
                };
            } else if (timerText === 'Ready') {
                return {
                    success: true,
                    timeLeft: 0
                };
            } else {
                const match = /(\d+):(\d+)/.exec(timerText);
                if (!match) {
                    return {
                        success: false,
                        error: 'Unknown'
                    };
                }
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                return {
                    success: true,
                    timeLeft: minutes * 60 + seconds
                };
            }
        }
    }

    private async playSound(sound: {url: string, volume: number}) {
        try {
            const audio = new Audio(sound.url);
            audio.volume = sound.volume;
            await audio.play();
        } catch {
            // Ignore errors, auto play might be blocked
        }
    }

    private async soundHorn() {
        await HornHud.soundHorn();
    }

    private async confirmHorn() {
        if (!HornHud.canSoundHorn()) {
            return;
        }

        if (confirm('Horn is Ready! Sound it?')) {
            await this.soundHorn();
        }
    }
};
