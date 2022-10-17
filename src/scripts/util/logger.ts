
export enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
}

export const DEFAULT_LOG_LEVEL: LogLevel = LogLevel.Info;

export interface ILogger {
    getLevel(): LogLevel;
    setLevel(level: LogLevel): void;

    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

export class Logger implements ILogger {
    private level: LogLevel = DEFAULT_LOG_LEVEL;

    public constructor(logLevel: LogLevel = DEFAULT_LOG_LEVEL) {
        this.setLevel(logLevel);
    }

    public setLevel(level: LogLevel): void {
        if (this.level !== level) {
            this.level = level;
        }
    }

    public getLevel(): LogLevel {
        return this.level;
    }

    public debug(message: string, ...args: any[]): void {
        this.log(LogLevel.Debug, message, ...args);
    }

    public info(message: string, ...args: any[]): void {
        this.log(LogLevel.Info, message, ...args);
    }

    public warn(message: string, ...args: any[]): void {
        this.log(LogLevel.Warn, message, ...args);
    }

    public error(message: string, ...args: any[]): void {
        this.log(LogLevel.Error, message, ...args);
    }

    private log(level: LogLevel, message: string, ...args: any[]): void {
        switch (level) {
            case LogLevel.Info:
                console.log(`MHCT: ${message}`, ...args);
                break;
            case LogLevel.Warn:
                console.warn(`MHCT: ${message}`, ...args);
                break;
            case LogLevel.Error:
                console.error(`MHCT: ${message}`, ...args);
                break;
            default:
                console.log(`MHCT: ${message}`, ...args);
                break;
        }
    }
}