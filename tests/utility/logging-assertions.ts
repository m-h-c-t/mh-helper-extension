import {mockLoggerService} from "@tests/e2e/util/setup-env";
/**
 * Simple test assertion helpers for logging
 */
export class LoggingAssertions {

    private static getWarnings() {
        return mockLoggerService.warn.mock.calls.map(call => call.join(' ')).join('\n');
    }

    private static getErrors() {
        return mockLoggerService.error.mock.calls.map(call => call.join(' ')).join('\n');
    }

    /**
     * Assert that no warnings or errors were logged
     */
    static expectNoWarningsOrErrors() {
        expect(mockLoggerService.error).not.toHaveBeenCalled();
        expect(mockLoggerService.warn).not.toHaveBeenCalled();
    }

    /**
     * Reset all logger mocks
     */
    static reset() {
        vi.resetAllMocks();
    }
}
