import { LogLevel, ConsoleLogger } from "@scripts/util/logger";

mockConsole();

describe('ConsoleLogger', () => {
    let logger: ConsoleLogger;

    beforeEach(() => {
        jest.clearAllMocks();
        logger = new ConsoleLogger(LogLevel.Debug);
    });

    it('defaults to info log level', () => {
        logger = new ConsoleLogger();
        expect(logger.getLevel()).toBe(LogLevel.Info);
    })

    it('sets and gets log level', () => {
        expect(logger.getLevel()).toBe(LogLevel.Debug);
        logger.setLevel(LogLevel.Error);
        expect(logger.getLevel()).toBe(LogLevel.Error);
    })

    describe('log to console with correct level', () => {
        it('debug', () => {
            logger.debug()
            expect(console.debug).toHaveBeenCalled();
        });

        it('info', () => {
            logger.info()
            expect(console.info).toHaveBeenCalled();
        });

        it('warn', () => {
            logger.warn()
            expect(console.warn).toHaveBeenCalled();
        });

        it('error', () => {
            logger.error()
            expect(console.error).toHaveBeenCalled();
        });
    });

    it('skips logging when level is high enough', () => {
        logger = new ConsoleLogger(LogLevel.Warn);

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
        expect(console.info).toHaveBeenLastCalledWith('MHCT: snap!');
    })
})

/**
 * Sets up mocks for common console logging functions
 */
function mockConsole(): void {
    const consoleFuncsToMock: (keyof Console)[] = ['debug', 'info', 'log', 'warn', 'error'];
    consoleFuncsToMock.map(v => {
        global.console[v] = jest.fn();
    })
}
