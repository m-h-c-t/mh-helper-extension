import { mockLoggerService } from '@tests/e2e/util/setup-env';
/**
 * Simple test assertion helpers for logging
 */
export class LoggingAssertions {
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
