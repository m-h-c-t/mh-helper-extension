import { filter, mergeMap } from 'rxjs';

import type { LoggerService } from '../logging';

import { fromChromeEvent } from '../browser/from-chrome-event';

export interface UserSettings {
    'tracking-hunts': boolean;
    'tracking-crowns': boolean;
    'tracking-convertibles': boolean;
    'tracking-events': boolean;
    'notification-sound': boolean;
    'notification-volume': number;
    'notification-custom': boolean;
    'notification-custom-url': string;
    'notification-desktop': boolean;
    'notification-alert-type': 'none' | 'intrusive' | 'background';
    'notification-message-display': 'hud' | 'toast' | 'banner';
    'notification-success-messages': boolean;
    'notification-error-messages': boolean;
    'enhancement-icon-timer': boolean;
    'enhancement-tsitu-loader': boolean;
    'enhancement-tsitu-loader-offset': number;
    'enhancement-escape-dismiss': boolean;
    'enhancement-dark-mode': boolean;
    'general-log-level': 'debug' | 'info' | 'warn' | 'error';
}

export class SettingsService {
    readonly userSettingsDefault: UserSettings = {
        'tracking-hunts': true,
        'tracking-crowns': true,
        'tracking-convertibles': true,
        'tracking-events': true,
        'notification-sound': false,
        'notification-volume': 100,
        'notification-custom': false,
        'notification-custom-url': '',
        'notification-desktop': false,
        'notification-alert-type': 'none',
        'notification-message-display': 'hud',
        'notification-success-messages': true,
        'notification-error-messages': true,
        'enhancement-icon-timer': true,
        'enhancement-tsitu-loader': false,
        'enhancement-tsitu-loader-offset': 80,
        'enhancement-escape-dismiss': false,
        'enhancement-dark-mode': false,
        'general-log-level': 'info',
    };

    readonly updates$;

    constructor(private readonly logger: LoggerService) {
        this.updates$ = fromChromeEvent(chrome.storage.onChanged).pipe(
            filter(([changes, areaName]) => areaName === 'sync'),
            mergeMap(async ([changes]) => {
                const updates: {key: keyof UserSettings, value: UserSettings[keyof UserSettings]}[] = [];

                for (const [key] of Object.entries(changes)) {
                    if (key in this.userSettingsDefault) {
                        const typedKey = key as keyof UserSettings;
                        const currentValue = await this.get(typedKey);
                        updates.push({key: typedKey, value: currentValue});
                    }
                }

                return updates;
            }),
            mergeMap(updates => updates)
        );
    }

    /**
     * Get settings values for the specified keys, falling back to defaults if not set.
     * @param keys Array of setting keys to retrieve
     * @returns Promise resolving to an object with the requested settings
     */
    async get<K extends keyof UserSettings>(key: K): Promise<UserSettings[K]> {
        const defaults: Record<string, UserSettings[K]> = {
            [key]: this.userSettingsDefault[key],
        };

        try {
            const result = await chrome.storage.sync.get(defaults);
            return result[key] as UserSettings[K];
        } catch (error) {
            this.logger.error('Failed to get settings from storage', error);
            return defaults[key];
        }
    }

    /**
     * Get all user settings, falling back to defaults for any missing keys.
     * @returns Promise resolving to the complete UserSettings object
     */
    async getAll(): Promise<UserSettings> {
        try {
            return await chrome.storage.sync.get<UserSettings>(this.userSettingsDefault);
        } catch (error) {
            this.logger.error('Failed to get all settings from storage', error);
            return {...this.userSettingsDefault};
        }
    }

    /**
     * Set a setting value. If the value matches the default, removes it from storage
     * to save space. Otherwise, saves the value to storage.
     * @param key The setting key to update
     * @param value The new value for the setting
     * @returns Promise that resolves when the operation is complete
     */
    async set<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<void> {
        if (!(key in this.userSettingsDefault)) {
            this.logger.error('Attempted to set unknown setting key:', key);
        }

        try {
            if (value === this.userSettingsDefault[key]) {
                // Remove from storage if it matches default (storage will return default via get method)
                await chrome.storage.sync.remove(key);
            } else {
                // Save to storage if it differs from default
                const settingToSave: Record<string, UserSettings[K]> = {
                    [key]: value,
                };
                await chrome.storage.sync.set(settingToSave);
            }
        } catch (error) {
            this.logger.error('Failed to set setting in storage', error);
            throw error;
        }
    }
}
