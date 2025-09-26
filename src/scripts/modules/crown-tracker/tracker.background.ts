import {BrowserApi} from "@scripts/services/browser/browser-api";
import {LoggerService} from "@scripts/services/logging/logger.service";
import {CrownTrackerBackgroundExtensionMessageHandlers, CrownData, CrownTrackerExtensionMessage, Crowns} from "./tracker.types";
import {z} from "zod";

/**
 * Crown Tracker background module to handle King's Crown data submissions.
 *
 * This class runs in the background listening for messages from the foreground
 * script to submit the crown counts to an external endpoint for storage.
 */
export class CrownTrackerBackground {
    private readonly crownPayloadSchema = z.object({
        user: z.string().min(1),
        crowns: z.record(z.enum(Crowns), z.number())
    });

    private readonly extensionMessageHandlers: CrownTrackerBackgroundExtensionMessageHandlers = {
        crownTrackerSubmit: ({message, sender}) => this.crownTrackerSubmit(message, sender),
    };

    constructor(
        private readonly logger: LoggerService
    ) { }

    async init(): Promise<void> {
        BrowserApi.messageListener("crownTracker", this.handleExtensionMessage);

        return Promise.resolve();
    }

    /**
     * Promise to submit the given crowns for external storage (e.g. for MHCC or others)
     * @param crowns Crown counts for the given user
     * @returns A promise that resolves with the submitted crowns, or `false` otherwise.
     */
    private async crownTrackerSubmit(
        data: CrownData,
        sender: chrome.runtime.MessageSender
    ): Promise<void> {
        const crownPayloadParseResult = this.crownPayloadSchema.safeParse(data);
        if (!crownPayloadParseResult.success) {
            this.logger.warn("CrownTracker invalid payload", z.prettifyError(crownPayloadParseResult.error));
            return;
        }

        const crownPayload = crownPayloadParseResult.data;
        if (Crowns.every((crown) => crownPayload.crowns[crown] === 0)) {
            this.logger.debug("CrownTracker no crowns to submit", {user: crownPayload.user, crowns: crownPayload.crowns});
            return;
        }

        const hash = Crowns.map((crown) => crownPayload.crowns[crown]).join(',');
        const existingHash = await chrome.storage.session.get([crownPayload.user]);
        if (existingHash[crownPayload.user] === hash) {
            this.logger.info(`CrownTracker skipping submission for user "${crownPayload.user}" (already sent).`);
            return;
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
                return;
            }

            const response = await fetch(endpoint, {...options, body: payload});

            if (!response.ok) {
                this.logger.warn('CrownTracker submission failed', {
                    status: response.status,
                    statusText: response.statusText,
                    user: crownPayload.user,
                });
                return;
            }

            this.logger.info('CrownTracker submission successful', {crownPayload});
        } catch (error) {
            this.logger.error('CrownTracker network error', {error, crownPayload});
            return;
        }

        try {
            await chrome.storage.session.set({[crownPayload.user]: hash});
        } catch {
            this.logger.warn('Unable to cache crown request');
        }

        await chrome.alarms.create(`crownTracker-${crownPayload.user}`, {when: Date.now() + 5 * 60 * 1000}); // 5 minutes
        BrowserApi.addListener(chrome.alarms.onAlarm, (alarm) => {
            if (alarm.name === `crownTracker-${crownPayload.user}`) {
                void chrome.storage.session.remove([crownPayload.user]);
                void chrome.alarms.clear(alarm.name);
            }
        });

        // Return total crowns submitted
        //return Object.values(crowns).reduce((a, b) => a + b, 0);
    };

    private handleExtensionMessage = (
        message: CrownTrackerExtensionMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
    ) => {
        const handler: CallableFunction | undefined = this.extensionMessageHandlers[message?.command];
        if (!handler) {
            return false;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const messageResponse = handler({message, sender});
        if (typeof messageResponse === "undefined") {
            return false;
        }

        Promise.resolve(messageResponse)
            .then((response) => sendResponse(response))
            .catch((error) => this.logger.error("Error handling extension message", error));

        return true;
    };
}
