import type { LogLevel } from './log-level';

export abstract class LoggerService {
    abstract debug(message?: unknown, ...args: unknown[]): void;
    abstract info(message?: unknown, ...args: unknown[]): void;
    abstract warn(message?: unknown, ...args: unknown[]): void;
    abstract error(message?: unknown, ...args: unknown[]): void;
    abstract log(level: LogLevel, message?: unknown, ...args: unknown[]): void;

    /**
     * Helper wrapper around `performance.measure` to log a measurement. Should also debug-log the data.
     *
     * @param start Start time of the measurement.
     * @param trackGroup A track-group for the measurement, should generally be the team owning the domain.
     * @param track A track for the measurement, should generally be the class name.
     * @param measureName A descriptive name for the measurement.
     * @param properties Additional properties to include.
     */
    abstract measure(
        start: DOMHighResTimeStamp,
        trackGroup: string,
        track: string,
        measureName: string,
        properties?: [string, unknown][]
    ): PerformanceMeasure;

    /**
     * Helper wrapper around `performance.mark` to log a mark. Should also debug-log the data.
     *
     * @param name Name of the mark to create.
     */
    abstract mark(name: string): PerformanceMark;
}
