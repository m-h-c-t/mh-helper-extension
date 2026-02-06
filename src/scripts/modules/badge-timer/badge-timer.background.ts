import type { LoggerService } from '@scripts/services/logging';
import type { SettingsService, SettingsUpdate, UserSettings } from '@scripts/services/settings/settings.service';

import { defineExtensionMessaging, type ExtensionMessage } from '@webext-core/messaging';

import type { BadgeTimerProtocolMap, TurnState } from './badge-timer.types';

export const badgeTimerExtensionMessenger = defineExtensionMessaging<BadgeTimerProtocolMap>();

// Constants
const BADGE_UPDATE_INTERVAL_MS = 500;
const SECONDS_PER_MINUTE = 60;
const SECONDS_THRESHOLD_FOR_ROUNDING = 30;

const BADGE_COLORS = {
    DEFAULT: '#222',
    HORN_READY: '#9B7617',
    ERROR: '#F00',
} as const;

const BADGE_TEXT = {
    EMPTY: '',
    HORN_READY: '🎺',
    ERROR: '!',
} as const;

interface BadgeState {
    text: string;
    color?: string;
}

/**
 * Manages the extension badge timer and horn-ready notifications.
 *
 * This class:
 * - Updates the badge icon with remaining time until horn is ready
 * - Triggers notifications when the horn becomes ready
 * - Handles various notification types (sound, desktop, alerts)
 */
export class BadgeTimerBackground {
    private settings!: UserSettings;
    private hasNotifiedHornReady = false;
    private lastExtensionMessage: ExtensionMessage | null = null;
    private turnState: TurnState | null = null;

    constructor(
        private readonly logger: LoggerService,
        private readonly settingsService: SettingsService
    ) {
        badgeTimerExtensionMessenger.onMessage('sendLoggedOut', () => this.handleLoggedOut());
        badgeTimerExtensionMessenger.onMessage('sendTurnState', message => void this.handleTurnStateMessage(message));
        badgeTimerExtensionMessenger.onMessage('getTimeLeft', () => {
            return this.calculateTimeRemaining();
        });
    }

    /**
     * Initialize the badge timer background service.
     * Sets up settings subscription and starts the badge update loop.
     */
    async init(): Promise<void> {
        this.settings = await this.settingsService.getAll();

        // Clear badge when icon timer is disabled
        this.settingsService.updates$
            .subscribe((update) => {
                this.handleSettingsUpdate(update);
            });

        // Update badge loop
        setInterval(() => {
            void this.updateBadge();
        }, BADGE_UPDATE_INTERVAL_MS);
    }

    /**
     * Handle settings updates and apply them to local cache.
     * This method uses type-safe update handling to ensure the correct types.
     * @param update - The settings update event
     */
    private handleSettingsUpdate<K extends keyof UserSettings>(update: SettingsUpdate<K>): void {
        this.settings[update.key] = update.value;

        if (update.key === 'enhancement-icon-timer' && update.value === false) {
            void this.clearBadge();
        }
    }

    private handleLoggedOut(): void {
        this.turnState = null;
    }

    private handleTurnStateMessage(message: ({data: TurnState} & ExtensionMessage)): void {
        this.turnState = message.data;
        this.lastExtensionMessage = message;
    }

    /**
     * Update the badge with current timer state.
     */
    private async updateBadge(): Promise<void> {
        if (!this.turnState) {
            await this.clearBadge();
            return;
        }

        try {
            if (this.turnState.success) {
                await this.handleTimerUpdate();
            } else {
                await this.showErrorBadge(this.turnState.error);
            }
        } catch (error) {
            this.logger.warn('Error getting turn state for badge timer', error);
            await this.clearBadge();
            this.hasNotifiedHornReady = true;
        }
    }

    /**
     * Update the extension badge with the specified state.
     * @param state - The badge state (text and optional color)
     * @param force - If true, update badge even if timer is disabled
     */
    private async setBadgeState(state: BadgeState, force = false): Promise<void> {
        if (this.settings['enhancement-icon-timer'] === true || force) {
            await chrome.action.setBadgeText({text: state.text});
            await chrome.action.setBadgeBackgroundColor({color: state.color ?? BADGE_COLORS.DEFAULT});
        }
    }

    /**
     * Clear the badge (shorthand for setting empty text).
     */
    private async clearBadge(): Promise<void> {
        await this.setBadgeState({text: BADGE_TEXT.EMPTY, color: BADGE_COLORS.DEFAULT}, true);
    }

    /**
     * Display an error indicator on the badge.
     */
    private async showErrorBadge(errorType: string): Promise<void> {
        this.logger.debug(`Badge timer error: ${errorType}`);
        await this.setBadgeState({
            text: BADGE_TEXT.ERROR,
            color: BADGE_COLORS.ERROR
        });
    }

    /**
     * Calculate the current time remaining based on turn state.
     * Uses {@link turnState.nextActiveTurnSeconds} (in seconds) and {@link turnState.updatedAt} (in milliseconds).
     * @returns Seconds remaining until horn is ready or -1 if unavailable
     */
    private calculateTimeRemaining(): number {
        if (!this.turnState?.success) {
            return -1;
        }

        const nextTurnTimestamp = this.turnState.updatedAt + (this.turnState.nextActiveTurnSeconds * 1000);
        const timeRemaining = nextTurnTimestamp - Date.now();
        const secondsRemaining = Math.ceil(timeRemaining / 1000);

        return Math.max(0, secondsRemaining);
    }

    /**
     * Handle timer update based on remaining time.
     */
    private async handleTimerUpdate(): Promise<void> {
        if (!this.turnState?.success) {
            return;
        }

        const currentTimeLeft = this.calculateTimeRemaining();

        // Only trigger horn ready notifications when time left is exactly zero.
        // If currentTimeLeft is -1 (e.g., logged out), notifications will not trigger.
        if (currentTimeLeft === 0) {
            if (!this.hasNotifiedHornReady) {
                this.hasNotifiedHornReady = true;

                const tabId = await this.getTabIdToNotify();
                if (tabId === -1) {
                    this.logger.warn('No MouseHunt tab found to notify for horn ready.');
                    return;
                }

                await this.triggerHornReadyNotifications(tabId);
            }
        } else {
            this.hasNotifiedHornReady = false;
            await this.updateTimerBadge(currentTimeLeft);
        }
    }

    /**
     * Update the badge with formatted time remaining.
     * @param timeLeft - Seconds remaining until horn is ready
     */
    private async updateTimerBadge(timeLeft: number): Promise<void> {
        if (timeLeft < SECONDS_PER_MINUTE) {
            // Show seconds for times under 1 minute
            await this.setBadgeState({
                text: `${timeLeft}s`,
                color: BADGE_COLORS.DEFAULT
            });
        } else {
            // Show minutes for times over 1 minute
            const minutes = this.calculateMinutesDisplay(timeLeft);
            await this.setBadgeState({
                text: `${minutes}m`,
                color: BADGE_COLORS.DEFAULT
            });
        }
    }

    /**
     * Calculate minutes to display, rounding up if seconds > 30.
     * @param timeLeft - Total seconds remaining
     * @returns Minutes to display
     */
    private calculateMinutesDisplay(timeLeft: number): number {
        const minutes = Math.floor(timeLeft / SECONDS_PER_MINUTE);
        const seconds = timeLeft % SECONDS_PER_MINUTE;

        // Round up if more than 30 seconds
        return seconds > SECONDS_THRESHOLD_FOR_ROUNDING ? minutes + 1 : minutes;
    }

    /**
     * Trigger all horn-ready notifications (badge, sound, desktop notification, alerts).
     * @param tabId - The MouseHunt tab ID
     */
    private async triggerHornReadyNotifications(tabId: number): Promise<void> {
        // Update badge to show horn is ready
        await this.setBadgeState({
            text: BADGE_TEXT.HORN_READY,
            color: BADGE_COLORS.HORN_READY
        });

        // Trigger all notification types based on user settings
        await this.playHornReadySound(tabId);
        await this.showDesktopNotification();
        await this.showHornReadyAlert(tabId);
    }

    /**
     * Play the horn-ready sound notification if enabled.
     */
    private async playHornReadySound(tabId: number): Promise<void> {
        const volume = this.settings['notification-volume'];
        const isSoundEnabled = this.settings['notification-sound'] === true;

        if (!isSoundEnabled || volume === 0) {
            return;
        }

        const soundUrl = this.getSoundUrl();
        const normalizedVolume = volume / 100;

        await badgeTimerExtensionMessenger.sendMessage('playSound', {
            url: soundUrl,
            volume: normalizedVolume,
        }, tabId);
    }

    /**
     * Get the sound URL based on user settings (custom or default).
     * @returns The sound file URL
     */
    private getSoundUrl(): string {
        if (this.settings['notification-custom'] === true) {
            return this.settings['notification-custom-url'];
        }
        return chrome.runtime.getURL('sounds/bell.mp3');
    }

    /**
     * Show desktop notification if enabled.
     */
    private async showDesktopNotification(): Promise<void> {
        if (this.settings['notification-desktop'] !== true) {
            return;
        }

        await chrome.notifications.create(
            'MHCT Horn',
            {
                type: 'basic',
                iconUrl: chrome.runtime.getURL('images/icon128.png'),
                title: 'MHCT Tools',
                message: 'MouseHunt Horn is ready!!! Good luck!',
            }
        );
    }

    /**
     * Show horn-ready alert based on user preference.
     * @param tabId - The MouseHunt tab ID
     */
    private async showHornReadyAlert(tabId: number): Promise<void> {
        const alertType = this.settings['notification-alert-type'];

        switch (alertType) {
            case 'background':
                await this.showBackgroundAlert(tabId);
                break;
            case 'intrusive':
                await this.showIntrusiveAlert(tabId);
                break;
            case 'none':
                // No alert to show
                break;
        }
    }

    /**
     * Show a background alert that doesn't steal focus.
     * @param tabId - The MouseHunt tab ID
     */
    private async showBackgroundAlert(tabId: number): Promise<void> {
        if (confirm('MouseHunt Horn is Ready! Sound it now?')) {
            await badgeTimerExtensionMessenger.sendMessage('soundHorn', undefined, tabId);
        }
    }

    /**
     * Show an intrusive alert that focuses the MouseHunt tab.
     * @param tabId - The MouseHunt tab ID
     */
    private async showIntrusiveAlert(tabId: number): Promise<void> {
        await chrome.tabs.update(tabId, {active: true});
        await badgeTimerExtensionMessenger.sendMessage('confirmHorn', undefined, tabId);
    }

    private async getTabIdToNotify(): Promise<number> {
        const preferredTab = await this.getPreferredTab();

        return preferredTab?.id
            ?? this.lastExtensionMessage?.sender.tab?.id
            ?? (await this.getAnyMouseHuntTab())?.id
            ?? -1;
    }

    /**
     * Get the preferred MouseHunt tab based on user focus and pinning.
     */
    private async getPreferredTab(): Promise<chrome.tabs.Tab | undefined> {
        // 1. Focused MH tab first
        const focusedTabs = await chrome.tabs.query({
            active: true,
            lastFocusedWindow: true,
            url: 'https://www.mousehuntgame.com/*'
        });

        if (focusedTabs.length > 0) {
            return focusedTabs[0];
        }

        // 2. Then prefer pinned tabs
        const pinnedMHTabs = await chrome.tabs.query({
            pinned: true,
            url: 'https://www.mousehuntgame.com/*'
        });

        if (pinnedMHTabs.length > 0) {
            // Prefer the most recently accessed pinned tab
            pinnedMHTabs.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
            return pinnedMHTabs[0];
        }

        // No preferred tab found, return undefined. The caller can decide what to do.
        return undefined;
    }

    private async getAnyMouseHuntTab(): Promise<chrome.tabs.Tab | undefined> {
        const mhTabs = await chrome.tabs.query({
            url: 'https://www.mousehuntgame.com/*'
        });

        return mhTabs.length > 0 ? mhTabs[0] : undefined;
    }
}
