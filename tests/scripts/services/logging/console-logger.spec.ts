import {ConsoleLogger, LogLevel} from "@scripts/services/logging";

mockConsole();

describe('ConsoleLogger', () => {
    let logger: ConsoleLogger;

    beforeEach(() => {
        jest.clearAllMocks();
        const isDev = true;
        logger = new ConsoleLogger(isDev);
    });

    describe('log to console with correct level', () => {
        it('debug', () => {
            logger.debug();
            expect(console.log).toHaveBeenCalled();
        });

        it('info', () => {
            logger.info();
            expect(console.log).toHaveBeenCalled();
        });

        it('warn', () => {
            logger.warn();
            expect(console.warn).toHaveBeenCalled();
        });

        it('error', () => {
            logger.error();
            expect(console.error).toHaveBeenCalled();
        });
    });

    it('skips logging when level is too low', () => {
        logger = new ConsoleLogger(false, (level) => level < LogLevel.Warn);

        logger.debug();
        logger.info();
        logger.warn();
        logger.error();

        expect(console.debug).not.toHaveBeenCalled();
        expect(console.info).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalled();
    });

    it('prefixes messages with MHCT:', () => {
        logger.info('snap!');
        expect(console.log).toHaveBeenLastCalledWith('MHCT: snap!');
    });
});

/**
 * Sets up mocks for common console logging functions
 */
function mockConsole(): void {
    const consoleFuncsToMock: (keyof Console)[] = ['debug', 'info', 'log', 'warn', 'error'];
    consoleFuncsToMock.map(v => {
        global.console[v] = jest.fn();
    });
}
