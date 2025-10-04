import type { LoggerService } from '../../logging';
import type { Migrator } from './migrator';

import { getMigrations } from './migrate';

export const CURRENT_VERSION = 1;

export interface MigrationState {
    currentVersion: number;
    storage: chrome.storage.StorageArea;
}

export class MigrationRunnerService {
    constructor(private logger: LoggerService) {}

    async run() {
        const currentVersion = await this.currentVersion();

        if (currentVersion < 0) {
            await chrome.storage.sync.set({version: CURRENT_VERSION});
            return;
        }

        await this.migrate({
            currentVersion: currentVersion,
            storage: chrome.storage.sync,
        });
    }

    async waitForCompletion(): Promise<void> {
        const isReady = async () => {
            const version = await this.currentVersion();
            // The saved version is what we consider the latest
            // migrations should be complete, the state version
            // shouldn't become larger than `CURRENT_VERSION` in
            // any normal usage of the application but it is common
            // enough in dev scenarios where we want to consider that
            // ready as well and return true in that scenario.
            return version >= CURRENT_VERSION;
        };

        const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

        const wait = async (time: number) => {
            // Wait exponentially
            const nextTime = time * 2;
            if (nextTime > 8192) {
                // Don't wait longer than ~8 seconds in a single wait,
                // if the migrations still haven't happened. They aren't
                // likely to.
                return;
            }

            if (!(await isReady())) {
                this.logger.info(`Waiting for migrations to finish, waiting for ${nextTime}ms`);
                await delay(nextTime);
                await wait(nextTime);
            }
        };

        if (!(await isReady())) {
            // Wait for 2ms to start with
            await wait(2);
        }
    }

    private async currentVersion(): Promise<number> {
        const version = (await chrome.storage.sync.get<{version?: number}>('version'))?.version;
        if (version == null) {
            // Old unversioned storage
            const existingStorage = await chrome.storage.sync.get(null);
            return Object.keys(existingStorage).length > 0
                ? 0 // Assume version 0 if there are any other keys
                : -1; // if storage is empty (new install)
        }

        return version;
    }

    private async migrate(state: MigrationState): Promise<void> {
        const migrations = getMigrations();

        for (const migration of migrations) {
            await this.runMigrator(state, migration);
        }
    }

    private async runMigrator(state: MigrationState, migration: Migrator<number, number>): Promise<void> {
        const shouldRun = await migration.shouldMigrate(state);
        if (shouldRun) {
            await migration.migrate(state);
            this.logger.info(`Migrator ${migration.constructor.name} (to version ${migration.toVersion}) completed.`);
            await migration.updateVersion(state);
        } else {
            this.logger.info(`Skipping migration from version ${migration.fromVersion} to ${migration.toVersion}`);
        }
    }
}
