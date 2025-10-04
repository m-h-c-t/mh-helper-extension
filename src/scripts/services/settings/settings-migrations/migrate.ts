import type { Migrator } from './migrator';

import { InitialMigration } from './migrations/1-initial-migration';

export function getMigrations(): Migrator<number, number>[] {
    return [
        new InitialMigration() // 0, 1
    ];
}
