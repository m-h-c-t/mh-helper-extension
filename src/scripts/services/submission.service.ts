import {HgItem, hgItemSchema, IntakeMessage, MhctResponseSchema} from "@scripts/types/mhct";
import {getUnixTimestamp} from "@scripts/util/time";
import {ApiService} from "./api.service";
import {EnvironmentService} from "./environment.service";
import {LoggerService} from "./logging";
import {UserSettings} from "./settings/settings.service";

export class SubmissionService {
    private userSettings!: UserSettings;

    constructor(private readonly logger: LoggerService,
        private readonly environmentService: EnvironmentService,
        private readonly apiService: ApiService,
        getSettings: () => Promise<UserSettings>,
        private readonly getBasicInfo: () => {
            hunter_id_hash: string;
            mhhh_version: number;
        },
        private readonly showFlashMessage: (type: "error" | "warning" | "success", message: string) => void,
    ) {
        void getSettings().then(settings => {
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

    async submitRelicHunterHint(hint: string): Promise<void> {
        if (this.userSettings['tracking-events'] === false) {
            return;
        }

        await this.postData(this.environmentService.getRhIntakeUrl(), {
            hint,
        });
    }

    async submitRelicHunterSighting(sighting:{
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

    private async postData(url: string, message: Record<string, unknown>): Promise<void> {
        const basicInfo = this.getBasicInfo();
        const timestamp = message.entry_timestamp ?? getUnixTimestamp();

        const uuidRequestBody: Record<string, unknown> = {};
        uuidRequestBody.extension_version = basicInfo.mhhh_version;
        uuidRequestBody.hunter_id_hash = basicInfo.hunter_id_hash;
        uuidRequestBody.entry_timestamp = timestamp;

        try {
            const uuid = await this.apiService.send('POST', this.environmentService.getUuidUrl(), uuidRequestBody, true);

            const submissionBody: Record<string, unknown> = message;
            submissionBody.uuid = uuid;
            Object.assign(submissionBody, uuidRequestBody);

            const submissionResponse = await this.apiService.send('POST', url, submissionBody, true);
            const parsedResponse = MhctResponseSchema.safeParse(submissionResponse);

            if (parsedResponse.success) {
                this.showFlashMessage(parsedResponse.data.status, parsedResponse.data.message);
            }
        } catch (e) {
            this.logger.error('An error occurred while submitting to MHCT', e);
        }
    }
}
