import {HgItem, hgItemSchema, IntakeMessage, MhctResponseSchema} from "@scripts/types/mhct";
import {UserSettings} from "@scripts/types/userSettings";
import {LoggerService} from "@scripts/util/logger";
import {getUnixTimestamp} from "@scripts/util/time";
import {ApiService} from "./api.service";
import {EnvironmentService} from "./environment.service";

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
        private readonly showFlashMessage: (message: string, status: string) => void,
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

        // @ts-expect-error No index signature
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

        const uuidResponse = await this.apiService.send('POST', this.environmentService.getUuidUrl(), uuidRequestBody);

        if (!uuidResponse.ok) {
            this.logger.error("Failed to get UUID", uuidResponse);
            return;
        }

        const submissionBody: Record<string, unknown> = message;
        submissionBody.uuid = await uuidResponse.text();
        Object.assign(submissionBody, uuidRequestBody);

        const submissionResponse = await this.apiService.send('POST', url, submissionBody);

        const response: unknown = await submissionResponse.json();
        const parsedResponse = MhctResponseSchema.safeParse(response);
        if (parsedResponse.success) {
            this.showFlashMessage(parsedResponse.data.message, parsedResponse.data.status);
        }
    }
}
