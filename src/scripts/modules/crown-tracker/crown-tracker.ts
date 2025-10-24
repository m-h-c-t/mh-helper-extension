import type { ApiService } from '@scripts/services/api.service';
import type { InterceptorService, RequestBody } from '@scripts/services/interceptor.service';
import type { LoggerService } from '@scripts/services/logging';
import type { HgResponse } from '@scripts/types/hg';

import { LogLevel } from '@scripts/services/logging';
import { defineWindowMessaging } from '@webext-core/messaging/page';
import { z } from 'zod';

import type { ExtensionLog } from '../extension-log/extension-log';
import type { CrownData, CrownTrackerProtocolMap, CrownTrackerSubmitResult } from './crown-tracker.types';

export const crownTrackerWindowMessenger = defineWindowMessaging<CrownTrackerProtocolMap>({
    namespace: 'mhct-helper-extension_crown-tracker',
});

/**
 * Crown Tracker module to monitor and submit King's Crown data.
 *
 * This class runs in the foreground listening for requests and responses related
 * to the Hunter Profile page, specifically targeting the King's Crown data. It
 * submits the crown counts to the background script for further processing.
 */
export class CrownTracker {
    public PROFILE_THOTTLE_MS = 5000;

    private readonly requestHunterProfileSchema = z.object({
        sn: z.literal('Hitgrab'),
        hg_is_ajax: z.literal('1'),
        page_class: z.literal('HunterProfile'),
        page_arguments: z.object({
            snuid: z.coerce.string(),
        }),
        last_read_journal_entry_id: z.coerce.number(),
        uh: z.string(),
    }).strict(); // .strict() is used to ensure that no extra properties are present in the request

    // to differentiate between a plain profile request and a King's Crown request
    private readonly requestKingsCrownSchema = z.object({
        page_class: z.literal('HunterProfile'),
        page_arguments: z.object({
            tab: z.literal('kings_crowns'),
            snuid: z.coerce.string(),
        }),
        last_read_journal_entry_id: z.coerce.number(),
        uh: z.string(),
    });

    private readonly responseKingsCrownSchema = z.object({
        page: z.object({
            tabs: z.object({
                kings_crowns: z.object({
                    subtabs: z.tuple([
                        z.object({
                            mouse_crowns: z.object({
                                user_name: z.string(),
                                badge_groups: z.array(z.object({
                                    name: z.string(),
                                    type: z.literal('bronze').or(z.literal('silver')).or(z.literal('gold')).or(z.literal('platinum')).or(z.literal('diamond')),
                                    count: z.coerce.number(),
                                }).or(z.object({
                                    type: z.literal('none'),
                                })))
                            })
                        })
                    ]).rest(z.unknown()),
                }),
            }),
        }),
    });

    private lastSentRequestTime?: Date;
    private lastSnuid: string | null = null;

    constructor(
        private readonly logger: LoggerService,
        private readonly extensionLog: ExtensionLog,
        private readonly interceptorService: InterceptorService,
        private readonly apiService: ApiService,
        private readonly showFlashMessage: (type: 'success' | 'warn' | 'error', message: string) => void,
    ) { }

    public init(): void {
        this.interceptorService.on('request', ({url, request}) => this.handleRequest(url, request));

        this.interceptorService.on('response', ({url, request, response}) => void this.handleResponse(url, request, response));
    }

    /* Handle requests to the Hunter Profile page so we can request King's Crowns */
    private handleRequest(url: URL, request: RequestBody): void {
        if (url.pathname !== '/managers/ajax/pages/page.php') {
            return;
        }

        const parsedRequestResult = this.requestHunterProfileSchema.safeParse(request);
        if (!parsedRequestResult.success) {
            return;
        }

        // This is a direct request for the King's Crowns (by navigating to the tab).
        // We don't need to invoke our own request.
        if (this.requestKingsCrownSchema.safeParse(request).success) {
            return;
        }

        const requestBody = parsedRequestResult.data;
        if (this.lastSnuid === requestBody.page_arguments.snuid) {
            this.logger.debug('Skipping King\'s Crown request (already requested for this user)');
            return;
        }

        // Throttle safety check
        const now = new Date();
        if (this.lastSentRequestTime !== undefined) {
            const timeSinceLastRequest = now.getTime() - this.lastSentRequestTime.getTime();
            if (timeSinceLastRequest < this.PROFILE_THOTTLE_MS) {
                this.logger.debug('Skipping King\'s Crown request (throttled)');
                return;
            }
        }

        this.lastSentRequestTime = now;
        // Request King's Crowns
        this.apiService.send('POST',
            '/managers/ajax/pages/page.php',
            {
                sn: 'Hitgrab',
                hg_is_ajax: '1',
                page_class: 'HunterProfile',
                page_arguments: {
                    legacyMode: '',
                    tab: 'kings_crowns',
                    sub_tab: 'false',
                    snuid: requestBody.page_arguments.snuid,
                },
                last_read_journal_entry_id: requestBody.last_read_journal_entry_id,
                uh: requestBody.uh,
            },
            false,
        ).catch((error) => {
            this.logger.error('Failed to send King\'s Crown request', error);
        });
    }

    private async handleResponse(url: URL, request: RequestBody, response: HgResponse) {
        if (url.pathname !== '/managers/ajax/pages/page.php') {
            return;
        }

        const parsedRequest = this.requestKingsCrownSchema.safeParse(request);
        if (!parsedRequest.success) {
            return;
        }

        const requestBody = parsedRequest.data;
        if (this.lastSnuid === requestBody.page_arguments.snuid) {
            this.logger.debug('Skipping King\'s Crown request (already requested for this user)');
            return;
        }

        const parsedResponse = this.responseKingsCrownSchema.safeParse(response);
        if (!parsedResponse.success) {
            this.logger.debug('Skipped crown submission due to unhandled XHR structure');

            this.logger.warn('Unhandled King\'s Crown response structure', {
                error: z.prettifyError(parsedResponse.error),
                request: parsedRequest.data,
                response: response,
            });

            await this.extensionLog.log(LogLevel.Warn, `Unhandled King's Crown response structure`, {
                error: z.prettifyError(parsedResponse.error),
                request: parsedRequest.data,
                response: response,
            });

            return;
        }

        // Craft a background message
        const message: CrownData = {
            user: parsedRequest.data.page_arguments.snuid,
            timestamp: Math.round(Date.now() / 1000),
            crowns: {
                bronze: 0,
                silver: 0,
                gold: 0,
                platinum: 0,
                diamond: 0,
            },
        };

        /** Rather than compute counts ourselves, use the `badge` display data.
         * badges: [
         *     {
         *         badge: (2500   | 1000     | 500  | 100    | 10),
         *         type: (diamond | platinum | gold | silver | bronze),
         *         mice: string[]
         *     },
         *     ...
         * ]
         */
        const mouseCrowns = parsedResponse.data.page.tabs.kings_crowns.subtabs[0].mouse_crowns;
        for (const badge of mouseCrowns.badge_groups) {
            if (badge.type === 'none') {
                continue;
            }

            message.crowns[badge.type] = badge.count;
        }
        this.logger.debug('Sending crowns payload to background: ', message);

        // We need to create a forwarding message to prevent other extensions (e.g. Privacy Badger)
        // from blocking submissions by submitting from the background script.
        try {
            const result: CrownTrackerSubmitResult = await crownTrackerWindowMessenger.sendMessage('submitCrowns', message);
            this.showFlashMessage(
                result.success ? 'success' : 'error',
                result.success
                    ? `Submitted ${result.count} crowns for ${mouseCrowns.user_name} to MHCC!`
                    : `Failed to submit crowns to MHCC: ${result.error}`
            );
        } catch (error) {
            this.logger.error('Failed to submit crowns to MHCC', error);
            this.showFlashMessage('error', `Failed to submit crowns to MHCC: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            this.lastSnuid = requestBody.page_arguments.snuid;
        }
    }
}
