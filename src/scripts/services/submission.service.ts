import type { HgItem, IntakeMessage } from '@scripts/types/mhct';
import type { $ZodIssueBase } from 'zod/v4/core';

import { hgItemSchema, MhctResponseSchema } from '@scripts/types/mhct';
import { getUnixTimestamp } from '@scripts/util/time';

import type { ApiService } from './api.service';
import type { EnvironmentService } from './environment.service';
import type { LoggerService } from './logging';
import type { UserSettings } from './settings/settings.service';

export class SubmissionService {
    private seenZodErrors = new Set<string>();
    private userSettings!: UserSettings;

    constructor(private readonly logger: LoggerService,
        private readonly environmentService: EnvironmentService,
        private readonly apiService: ApiService,
        getSettings: () => Promise<UserSettings>,
        private readonly getBasicInfo: () => {
            hunter_id_hash: string;
            mhhh_version: number;
        },
        private readonly showFlashMessage: (type: 'error' | 'warning' | 'success', message: string) => void,
    ) {
        void getSettings().then((settings) => {
            this.userSettings = settings;
        });
    }

    async submitEventConvertible(convertible: HgItem, items: HgItem[]): Promise<void> {
        if (this.userSettings['tracking-events'] === false) {
            return;
        }

        await this.submitConvertible(convertible, items);
    }

    async submitHunt(hunt: IntakeMessage): Promise<void> {
        if (this.userSettings['tracking-hunts'] === false) {
            return;
        }

        await this.postData(this.environmentService.getMainIntakeUrl(), hunt);
    }

    async submitItemConvertible(convertible: HgItem, items: HgItem[]): Promise<void> {
        if (this.userSettings['tracking-convertibles'] === false) {
            return;
        }

        await this.submitConvertible(convertible, items);
    }

    async submitRejection(rejection: Record<string, unknown>): Promise<void> {
        if (this.userSettings['tracking-hunts'] === false) {
            return;
        }

        await this.postData(this.environmentService.getRejectionIntakeUrl(), rejection);
    }

    async submitZodError(url: string, issues: $ZodIssueBase[], context: Record<string, unknown>): Promise<void> {
        if (this.userSettings['tracking-errors'] === false) {
            return;
        }

        // Avoid spamming the same error multiple times
        const errorKey = JSON.stringify(issues);
        if (process.env.ENV !== 'development' && this.seenZodErrors.has(errorKey)) {
            return;
        }
        this.seenZodErrors.add(errorKey);

        const zodMessage = {
            url,
            issues: JSON.stringify(issues),
            context: JSON.stringify(context),
        };

        if (process.env.ENV === 'development') {
            (zodMessage as Record<string, unknown>).XDEBUG_SESSION = 'PHPSTORM';
        }

        await this.postData(this.environmentService.getErrorIntakeUrl(), zodMessage, false);
    }

    async submitRelicHunterHint(hint: string): Promise<void> {
        if (this.userSettings['tracking-events'] === false) {
            return;
        }

        await this.postData(this.environmentService.getRhIntakeUrl(), {
            hint,
        });
    }

    async submitRelicHunterSighting(sighting: {
        rh_environment: string;
        entry_timestamp: number;
    }): Promise<void> {
        if (this.userSettings['tracking-events'] === false) {
            return;
        }

        await this.postData(this.environmentService.getRhIntakeUrl(), sighting);
    }

    async submitTreasureMap(map: {
        mice: Record<number, string>;
        id: number;
        name: string;
    }): Promise<void> {
        if (this.userSettings['tracking-convertibles'] !== true) {
            return;
        }

        await this.postData(this.environmentService.getMapIntakeUrl(), map);
    }

    private async submitConvertible(convertible: HgItem, items: HgItem[]): Promise<void> {
        const record = {
            convertible: hgItemSchema.parse(convertible),
            items: items.map(item => hgItemSchema.parse(item)),
            asset_package_hash: Date.now(),
        };

        await this.postData(this.environmentService.getConvertibleIntakeUrl(), record);
    }

    private async postData(url: string, message: Record<string, unknown>, showFlashMessage = true): Promise<void> {
        const basicInfo = this.getBasicInfo();
        const timestamp = message.entry_timestamp ?? getUnixTimestamp();

        const uuidRequestBody: Record<string, unknown> = {};
        uuidRequestBody.extension_version = basicInfo.mhhh_version;
        uuidRequestBody.hunter_id_hash = basicInfo.hunter_id_hash;
        uuidRequestBody.entry_timestamp = timestamp;

        try {
            this.logger.debug('Submitting to MHCT', url, message);

            const uuid = await this.apiService.send('POST', this.environmentService.getUuidUrl(), uuidRequestBody, true);

            const submissionBody: Record<string, unknown> = message;
            submissionBody.uuid = uuid;
            Object.assign(submissionBody, uuidRequestBody);

            const submissionResponse = await this.apiService.send('POST', url, submissionBody, true);
            const parsedResponse = MhctResponseSchema.safeParse(submissionResponse);

            if (parsedResponse.success && showFlashMessage) {
                this.showFlashMessage(parsedResponse.data.status, parsedResponse.data.message);
            }
        } catch (e) {
            this.logger.error('An error occurred while submitting to MHCT', e);
        }
    }
}
