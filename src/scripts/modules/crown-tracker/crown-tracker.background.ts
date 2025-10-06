import type { LoggerService } from '@scripts/services/logging/logger.service';

import { BrowserApi } from '@scripts/services/browser/browser-api';
import { defineExtensionMessaging } from '@webext-core/messaging';
import { z } from 'zod';

import type { CrownData, CrownTrackerProtocolMap, CrownTrackerSubmitResult } from './crown-tracker.types';

import { crownDataSchema, Crowns } from './crown-tracker.types';

export const crownTrackerExtensionMessenger = defineExtensionMessaging<CrownTrackerProtocolMap>();

/**
 * Crown Tracker background module to handle King's Crown data submissions.
*
* This class runs in the background listening for messages from the foreground
* script to submit the crown counts to an external endpoint for storage.
*/
export class CrownTrackerBackground {
    constructor(
        private readonly logger: LoggerService
    ) { }

    init() {
        crownTrackerExtensionMessenger.onMessage('submitCrowns', (message) => {
            return this.crownTrackerSubmit(message.data);
        });
    }

    /**
     * Promise to submit the given crowns for external storage (e.g. for MHCC or others)
     * @param message Crown data message from foreground
     * @returns A promise that resolves when submission is complete
     */
    private async crownTrackerSubmit(
        message: CrownData
    ): Promise<CrownTrackerSubmitResult> {
        const crownPayloadParseResult = crownDataSchema.safeParse(message);
        if (!crownPayloadParseResult.success) {
            this.logger.warn('CrownTracker invalid payload', z.prettifyError(crownPayloadParseResult.error));
            return {success: false, error: 'Invalid payload'};
        }

        const crownPayload = crownPayloadParseResult.data;
        const crownCount = Object.values(crownPayload.crowns).reduce((a, b) => a + b, 0);
        if (crownCount === 0) {
            this.logger.debug('CrownTracker no crowns to submit', {user: crownPayload.user, crowns: crownPayload.crowns});

            return {success: false, error: 'No crowns to submit'};
        }

        const hash = Crowns.map(crown => crownPayload.crowns[crown]).join(',');
        const existingHash = await chrome.storage.session.get([crownPayload.user]);
        if (existingHash[crownPayload.user] === hash) {
            this.logger.info(`CrownTracker skipping submission for user "${crownPayload.user}" (already sent).`);

            return {success: false, error: 'Already submitted'};
        }

        const endpoint = 'https://script.google.com/macros/s/AKfycbztymdfhwOe4hpLIdVLYCbOTB66PWNDtnNRghg-vFx5u2ogHmU/exec';
        const options: RequestInit = {
            mode: 'cors',
            method: 'POST',
            credentials: 'omit',
        };

        const payload = new FormData();
        payload.set('main', JSON.stringify(crownPayload));

        try {
            // In dev mode, skip actual submission
            if (process.env.NODE_ENV === 'development') {
                this.logger.debug('CrownTracker submission payload', {crownPayload});
                return {success: true, count: crownCount};
            }

            const response = await fetch(endpoint, {...options, body: payload});

            if (!response.ok) {
                this.logger.warn('CrownTracker submission failed', {
                    status: response.status,
                    statusText: response.statusText,
                    user: crownPayload.user,
                });

                return {success: false, error: 'Http request failed'};
            }

            this.logger.info('CrownTracker submission successful', {crownPayload});
        } catch (error) {
            this.logger.error('CrownTracker network error', {error, crownPayload});

            return {success: false, error: 'Network error'};
        }

        try {
            await chrome.storage.session.set({[crownPayload.user]: hash});
        } catch {
            this.logger.warn('Unable to cache crown request');
        }

        await chrome.alarms.create(`crownTracker-${crownPayload.user}`, {when: Date.now() + 5 * 60 * 1000}); // 5 minutes
        BrowserApi.addListener(chrome.alarms.onAlarm, (alarm: chrome.alarms.Alarm) => {
            if (alarm.name === `crownTracker-${crownPayload.user}`) {
                void chrome.storage.session.remove([crownPayload.user]);
                void chrome.alarms.clear(alarm.name);
            }
        });

        return {success: true, count: crownCount};
    }
}
