import type { UserSettings } from '../../settings.service';

import { Migrator } from '../migrator';

interface OldSettings {
    tracking_enabled: boolean;
    horn_sound: boolean;
    horn_volume: number;
    custom_sound: string;
    horn_alert: boolean;
    horn_webalert: boolean;
    horn_popalert: boolean;
    message_display: 'hud' | 'toast' | 'banner';
    success_messages: boolean;
    error_messages: boolean;
    icon_timer: boolean;
    tsitu_loader_on: boolean;
    tsitu_loader_offset: number;
    escape_button_close: boolean;
    dark_mode: boolean;
}

const defaults: OldSettings = {
    tracking_enabled: true,
    horn_sound: false,
    horn_volume: 100,
    custom_sound: '',
    horn_alert: false,
    horn_webalert: false,
    horn_popalert: false,
    message_display: 'hud',
    success_messages: true,
    error_messages: true,
    icon_timer: true,
    tsitu_loader_on: false,
    tsitu_loader_offset: 80,
    escape_button_close: false,
    dark_mode: false,
};

export class InitialMigration extends Migrator<0, 1> {
    constructor() {
        super(0, 1);
    }

    async migrate(): Promise<void> {
        // tracking
        const old = await chrome.storage.sync.get<OldSettings>(defaults);

        const newSettings: Partial<UserSettings> = {};
        newSettings['tracking-hunts'] = old.tracking_enabled;
        newSettings['tracking-crowns'] = old.tracking_enabled;

        // notification
        newSettings['notification-sound'] = old.horn_sound;
        newSettings['notification-volume'] = old.horn_volume;
        newSettings['notification-custom'] = old.custom_sound !== '';
        newSettings['notification-custom-url'] = old.custom_sound;
        newSettings['notification-desktop'] = old.horn_alert;
        const intrusive = old.horn_webalert;
        const background = old.horn_popalert;

        if (!intrusive && !background) {
            newSettings['notification-alert-type'] = 'none';
        } else if (intrusive) {
            newSettings['notification-alert-type'] = 'intrusive';
        } else if (background) {
            newSettings['notification-alert-type'] = 'background';
        }

        newSettings['notification-message-display'] = old.message_display;
        newSettings['notification-success-messages'] = old.success_messages;
        newSettings['notification-error-messages'] = old.error_messages;

        // enhancement
        newSettings['enhancement-icon-timer'] = old.icon_timer;
        newSettings['enhancement-tsitu-loader'] = old.tsitu_loader_on;
        newSettings['enhancement-tsitu-loader-offset'] = old.tsitu_loader_offset;
        newSettings['enhancement-escape-dismiss'] = old.escape_button_close;
        newSettings['enhancement-dark-mode'] = old.dark_mode;

        await chrome.storage.sync.remove(Object.keys(defaults));
        await chrome.storage.sync.set(newSettings);
    }
}
