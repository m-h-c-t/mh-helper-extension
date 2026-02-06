import { BadgeTimerBackground } from '@scripts/modules/badge-timer/badge-timer.background';
import { CrownTrackerBackground } from '@scripts/modules/crown-tracker/crown-tracker.background';
import { ExtensionLogBackground } from '@scripts/modules/extension-log/extension-log.background';
import { OmniboxBackground } from '@scripts/modules/omnibox/omnibox.background';
import { EnvironmentService } from '@scripts/services/environment.service';
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
    badgeTimerBackground: BadgeTimerBackground;
    omniboxBackground: OmniboxBackground;

    constructor() {
        const isDev = process.env.ENV === 'development';

        this.logger = new ConsoleLogger(isDev);
        this.runtimeBackground = new RuntimeBackground(this.logger);
        this.settingsService = new SettingsService(this.logger);
        this.migrationService = new MigrationRunnerService(this.logger);
        this.extensionLogBackground = new ExtensionLogBackground(this.logger);
        this.crownTrackerBackground = new CrownTrackerBackground(this.logger);
        this.badgeTimerBackground = new BadgeTimerBackground(this.logger, this.settingsService);
        this.omniboxBackground = new OmniboxBackground(this.logger, new EnvironmentService());
    }

    async bootstrap() {
        this.logger.info('Bootstrapping background service...');

        await this.migrationService.run();
        await this.runtimeBackground.init();
        this.extensionLogBackground.init();
        this.crownTrackerBackground.init();
        await this.badgeTimerBackground.init();
        await this.omniboxBackground.init();
    }
}
