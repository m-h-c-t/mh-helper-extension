import type { LogLevel } from '@scripts/services/logging';

export interface ExtensionLogData {
    level: LogLevel;
    message: unknown;
    args?: unknown[];
}

export interface ExtensionLogProtocolMap {
    log(data: ExtensionLogData): void;
}
