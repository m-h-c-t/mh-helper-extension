import { CrownTrackerBackground } from '@scripts/modules/crown-tracker/tracker.background';
import { ExtensionLogBackground } from '@scripts/modules/extension-log/extension-log.background';
import { ConsoleLogger } from '@scripts/services/logging';
import { MigrationRunnerService } from '@scripts/services/settings/settings-migrations/migration-runner.service';
import { SettingsService } from '@scripts/services/settings/settings.service';

import RuntimeBackground from './runtime.background';

export default class MainBackground {
    logger: ConsoleLogger;
    runtimeBackground: RuntimeBackground;
    settingsService: SettingsService;
    migrationService: MigrationRunnerService;
    crownTrackerBackground: CrownTrackerBackground;
    extensionLogBackground: ExtensionLogBackground;

    constructor() {
        const isDev = process.env.ENV === 'development';

        this.logger = new ConsoleLogger(isDev);
        this.runtimeBackground = new RuntimeBackground(this.logger);
        this.settingsService = new SettingsService(this.logger);
        this.migrationService = new MigrationRunnerService(this.logger);
        this.extensionLogBackground = new ExtensionLogBackground(this.logger);
        this.crownTrackerBackground = new CrownTrackerBackground(this.logger);
    }

    async bootstrap() {
        this.logger.info('Bootstrapping background service...');

        await this.migrationService.run();
        await this.runtimeBackground.init();
        await this.extensionLogBackground.init();
        await this.crownTrackerBackground.init();
    }
}
