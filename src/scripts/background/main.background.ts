import {ConsoleLogger} from "@scripts/services/logging";
import RuntimeBackground from "./runtime.background";
import {MigrationRunnerService} from "@scripts/services/settings/settings-migrations/migration-runner.service";
import {SettingsService} from "@scripts/services/settings/settings.service";

export default class MainBackground {
    logger: ConsoleLogger;
    runtimeBackground: RuntimeBackground;
    settingsService: SettingsService;
    migrationService: MigrationRunnerService;

    constructor() {
        const isDev = process.env.ENV === "development";

        this.logger = new ConsoleLogger(isDev);
        this.runtimeBackground = new RuntimeBackground(this.logger);
        this.settingsService = new SettingsService(this.logger);
        this.migrationService = new MigrationRunnerService(this.logger);
    }

    async bootstrap() {
        this.logger.info("Bootstrapping background service...");

        await this.migrationService.run();

        await this.runtimeBackground.init();
    }
}
