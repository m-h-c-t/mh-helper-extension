import type { LoggerService } from '@scripts/services/logging';

import { UserBuilder } from '@tests/utility/builders';
import $ from 'jquery';
import nock from 'nock';

export const mockLoggerService = {
    debug: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    measure: vi.fn(),
    mark: vi.fn(),
} satisfies LoggerService;

beforeAll(async () => {
    nock.disableNetConnect();
    const mainLoaded = setupMain();
    vi
        .useFakeTimers()
        .setSystemTime(1212121000);

    await import('@scripts/main');
    await mainLoaded;
});

afterAll(() => {
    vi.useRealTimers();
    nock.enableNetConnect();
});

function setupMain() {
    // vi.stubEnv('ENV', 'development');
    mockConsole();
    stubContentScript();
    setupDOM();
    setupWindowGlobals();

    // Need to wait for 'import('main.js')' to finish before testing. import is async.
    // Main fires a message when finally done loading.
    // We can wait for that and resolve a promise when received.
    return new Promise<void>((resolve) => {
        const listener = (event: MessageEvent<Record<string, unknown>>) => {
            if (typeof event.data.mhct_finish_load === 'number' && event.data.mhct_finish_load === 1) {
                window.removeEventListener('message', listener);
                resolve();
            }
        };
        window.addEventListener('message', listener);
    });
}

/**
 * Sets up mocks for common console logging functions
 */
function mockConsole(): void {
    vi.mock('@scripts/services/logging', () => ({
        ConsoleLogger: vi.fn().mockImplementation(function () { return mockLoggerService; }),
    }));
}

/**
 * Simplest stub of the content script required for main to start
 */
function stubContentScript() {
    window.addEventListener('message', (event) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = event.data;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (data.mhct_settings_request === 1) {
            window.postMessage({
                mhct_settings_response: 1,
                settings: {
                    'tracking-hunts': true,
                    'tracking-crowns': true,
                    'tracking-convertibles': true,
                    'tracking-events': true,
                    'notification-sound': false,
                    'notification-volume': 100,
                    'notification-custom': false,
                    'notification-custom-url': '',
                    'notification-desktop': false,
                    'notification-alert-type': 'none',
                    'notification-message-display': 'hud',
                    'notification-success-messages': true,
                    'notification-error-messages': true,
                    'enhancement-icon-timer': true,
                    'enhancement-tsitu-loader': false,
                    'enhancement-tsitu-loader-offset': 80,
                    'enhancement-escape-dismiss': false,
                    'enhancement-dark-mode': false,
                    'general-log-level': 'info',
                },
            }, '*');
        }
    }, false);
}

function setupDOM() {
    // main.js looks for extension version in DOM
    document.body.innerHTML = `
    <input id="mhhh_version" type="hidden" value="0.0.0" />
    `;
}

function setupWindowGlobals() {
    // main.js requires a few things on the window that aren't a part of jsdom implementation
    Object.assign(window, {
        $: $,
        jQuery: $,
        user: new UserBuilder().build(),
        lastReadJournalEntryId: 1337,
    });
}
