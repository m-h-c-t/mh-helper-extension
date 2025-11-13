import type { InterceptorService, RequestBody } from '@scripts/services/interceptor.service';
import type { HgResponse, User } from '@scripts/types/hg';

import { HornHud } from '@scripts/util/hornHud';
import { defineWindowMessaging } from '@webext-core/messaging/page';

import type { BadgeTimerProtocolMap, TurnState } from './badge-timer.types';

export const badgeTimerWindowMessenger = defineWindowMessaging<BadgeTimerProtocolMap>({
    namespace: 'mhct-helper-extension_badgeTimer',
});

export class BadgeTimer {
    constructor(
        private readonly interceptorService: InterceptorService
    ) {
        this.interceptorService.on('response', ({request, response}) => void this.handleResponse(request, response));
    }

    /**
     * Returns the current user object or undefined if not logged in.
     * Unlogged-in users are represented as an empty array by the game.
     */
    private getCurrentUser(): User | undefined {
        return !Array.isArray(window.user) ? window.user : undefined;
    }

    init() {
        badgeTimerWindowMessenger.onMessage('playSound', (message) => {
            return this.playSound(message.data);
        });
        badgeTimerWindowMessenger.onMessage('soundHorn', () => {
            return this.soundHorn();
        });
        badgeTimerWindowMessenger.onMessage('confirmHorn', () => {
            return this.confirmHorn();
        });

        try {
            // On page load send initial state.
            // Unlogged-in user is represented as an empty array by the game, so we treat that as undefined.
            void badgeTimerWindowMessenger.sendMessage('sendTurnState', this.getTurnState(this.getCurrentUser()));
        } catch {
            // ignore errors
        }
    }

    async handleResponse(request: RequestBody, response: HgResponse) {
        if (request.action === 'logout') {
            await badgeTimerWindowMessenger.sendMessage('sendLoggedOut');
        } else {
            await badgeTimerWindowMessenger.sendMessage('sendTurnState', this.getTurnState(response.user));
        }
    }

    private getTurnState(user: User | undefined): TurnState {
        let turnState: TurnState;
        if (!user) {
            turnState = {
                success: false,
                error: 'Logged out'
            };
        } else {
            if (user.has_puzzle) {
                turnState = {
                    success: false,
                    error: 'King\'s Reward'
                };
            } else {
                turnState = {
                    success: true,
                    nextActiveTurnSeconds: user.next_activeturn_seconds,
                    updatedAt: Date.now(),
                };
            }
        }

        return turnState;
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
        if (confirm('Horn is Ready! Sound it?')) {
            await this.soundHorn();
        }
    }
};
