import {InitialMigration} from "./migrations/1-initial-migration";
import {Migrator} from "./migrator";

export function getMigrations(): Migrator<number,number>[] {
    return [
        new InitialMigration() // 0, 1
    ];
}
