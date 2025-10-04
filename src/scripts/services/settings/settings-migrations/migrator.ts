import type { MigrationState } from './migration-runner.service';

export abstract class Migrator<TFrom extends number, TTo extends number> {
    constructor(
        public fromVersion: TFrom,
        public toVersion: TTo
    ) { }

    async shouldMigrate(state: MigrationState): Promise<boolean> {
        return Promise.resolve(state.currentVersion === this.fromVersion);
    }

    async updateVersion(state: MigrationState): Promise<void> {
        state.currentVersion = this.toVersion;
        await state.storage.set({version: this.toVersion});
    }

    abstract migrate(state: MigrationState): Promise<void>;
}
