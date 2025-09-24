import {LogLevel} from "./log-level";
import {LoggerService} from "./logger.service";

export class ConsoleLogger implements LoggerService {

    public constructor(
        private isDev: boolean,
        private filter: ((level: LogLevel) => boolean) | null = null,
    ) {}

    debug(message?: unknown, ...args: unknown[]): void {
        if (!this.isDev) {
            return;
        }

        this.log(LogLevel.Debug, message, ...args);
    }

    info(message?: unknown, ...args: unknown[]): void {
        this.log(LogLevel.Info, message, ...args);
    }

    warn(message?: unknown, ...args: unknown[]): void {
        this.log(LogLevel.Warn, message, ...args);
    }

    error(message?: unknown, ...args: unknown[]): void {
        this.log(LogLevel.Error, message, ...args);
    }

    log(level: LogLevel, message?: unknown, ...args: unknown[]): void {
        if (this.filter != null && !this.filter(level)) {
            return;
        }

        if (typeof message === 'string') {
            message = `MHCT: ${message}`;
        }

        switch (level) {
            case LogLevel.Debug:
                console.debug(message, ...args);
                break;
            case LogLevel.Info:
                console.info(message, ...args);
                break;
            case LogLevel.Warn:
                console.warn(message, ...args);
                break;
            case LogLevel.Error:
                console.error(message, ...args);
                break;
            default:
                console.log(message, ...args);
                break;
        }
    }

    measure(
        start: DOMHighResTimeStamp,
        trackGroup: string,
        track: string,
        name?: string,
        properties?: [string, unknown][],
    ): PerformanceMeasure {
        const measureName = `[${track}]: ${name}`;

        const measure = performance.measure(measureName, {
            start: start,
            detail: {
                devtools: {
                    dataType: "track-entry",
                    track,
                    trackGroup,
                    properties,
                },
            },
        });

        this.info(`${measureName} took ${measure.duration}`, properties);
        return measure;
    }

    mark(name: string): PerformanceMark {
        const mark = performance.mark(name, {
            detail: {
                devtools: {
                    dataType: "marker",
                },
            },
        });

        this.info(mark.name, new Date().toISOString());

        return mark;
    }
}
