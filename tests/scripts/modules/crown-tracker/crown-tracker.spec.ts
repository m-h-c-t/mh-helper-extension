import type { ExtractEventNames } from '@mswjs/interceptors';
import type { CrownData, CrownTrackerSubmitResult } from '@scripts/modules/crown-tracker/crown-tracker.types';
import type { ExtensionLog } from '@scripts/modules/extension-log/extension-log';
import type { ApiService } from '@scripts/services/api.service';
import type { InterceptorEventMap, InterceptorService, PromiseLikeListener, RequestBody } from '@scripts/services/interceptor.service';
import type { LoggerService } from '@scripts/services/logging';
import type { HgResponse } from '@scripts/types/hg';

import { CrownTracker, crownTrackerWindowMessenger } from '@scripts/modules/crown-tracker/crown-tracker';
import { LogLevel } from '@scripts/services/logging';
import { HgResponseBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

// Mock the window messenger
vi.mock('@webext-core/messaging/page', () => ({
    defineWindowMessaging: vi.fn(() => ({
        sendMessage: vi.fn(),
    })),
}));

describe('CrownTracker', () => {
    let crownTracker: CrownTracker;
    let mockLogger: LoggerService;
    let mockExtensionLog: ExtensionLog;
    let mockInterceptorService: InterceptorService;
    let mockApiService: ApiService;
    let mockShowFlashMessage: (type: 'success' | 'warn' | 'error', message: string) => void;

    let requestHandler: PromiseLikeListener<InterceptorEventMap['request']>;
    let responseHandler: PromiseLikeListener<InterceptorEventMap['response']>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        mockLogger = mock<LoggerService>();
        mockExtensionLog = mock<ExtensionLog>();
        mockInterceptorService = mock<InterceptorService>();
        mockApiService = mock<ApiService>();
        mockShowFlashMessage = vi.fn();

        mockInterceptorService.on = vi.fn((event: ExtractEventNames<InterceptorEventMap>, handler: PromiseLikeListener<InterceptorEventMap[typeof event]>) => {
            if (event === 'request') {
                requestHandler = handler;
            } else if (event === 'response') {
                responseHandler = handler;
            }

            return mockInterceptorService;
        });

        // Ensure the send method is properly mocked
        mockApiService.send = vi.fn().mockResolvedValue({});

        crownTracker = new CrownTracker(
            mockLogger,
            mockExtensionLog,
            mockInterceptorService,
            mockApiService,
            mockShowFlashMessage
        );
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('init', () => {
        it('should register request and response handlers with interceptor service', () => {
            crownTracker.init();

            expect(mockInterceptorService.on).toHaveBeenCalledTimes(2);
            expect(mockInterceptorService.on).toHaveBeenCalledWith('request', expect.any(Function));
            expect(mockInterceptorService.on).toHaveBeenCalledWith('response', expect.any(Function));
        });
    });

    describe('handleRequest', () => {
        beforeEach(() => {
            crownTracker.init();
        });

        it('should ignore requests not to page.php', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/other.php');
            const request = {};

            // Get the registered handler
            await requestHandler({
                url, request,
                requestId: ''
            });

            expect(mockApiService.send).not.toHaveBeenCalled();
        });

        it('should ignore requests that do not match HunterProfile schema', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = {
                sn: 'Other',
                page_class: 'OtherPage'
            };

            await requestHandler({
                url, request,
                requestId: ''
            });

            expect(mockApiService.send).not.toHaveBeenCalled();
        });

        it('should ignore requests that are already King\'s Crown requests', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = {
                page_class: 'HunterProfile',
                page_arguments: {
                    tab: 'kings_crowns',
                    snuid: '12345'
                },
                last_read_journal_entry_id: '123',
                uh: 'test-uh'
            };

            await requestHandler({
                url, request,
                requestId: ''
            });

            expect(mockApiService.send).not.toHaveBeenCalled();
        });

        it('should throttle requests made within 5 seconds', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request1 = {
                sn: 'Hitgrab',
                hg_is_ajax: '1',
                page_class: 'HunterProfile',
                page_arguments: {
                    snuid: '12345'
                },
                last_read_journal_entry_id: '123',
                uh: 'test-uh'
            };
            const request2 = {
                ...request1,
                page_arguments: {
                    snuid: '67890'
                }
            };

            // First request
            await requestHandler({url, request: request1, requestId: ''});
            expect(mockApiService.send).toHaveBeenCalledTimes(1);

            // Second request within 5 seconds should be throttled
            vi.advanceTimersByTime(3000);
            await requestHandler({url, request: request2, requestId: ''});
            expect(mockApiService.send).toHaveBeenCalledTimes(1);
            expect(mockLogger.debug).toHaveBeenCalledWith('Skipping King\'s Crown request (throttled)');

            // Third request after 5 seconds should go through
            vi.advanceTimersByTime(3000);
            await requestHandler({url, request: request2, requestId: ''});
            expect(mockApiService.send).toHaveBeenCalledTimes(2);
        });

        it('should send King\'s Crown request for valid HunterProfile request', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = {
                sn: 'Hitgrab',
                hg_is_ajax: '1',
                page_class: 'HunterProfile',
                page_arguments: {
                    snuid: '12345'
                },
                last_read_journal_entry_id: '123',
                uh: 'test-uh'
            };

            await requestHandler({url, request, requestId: ''});

            expect(mockApiService.send).toHaveBeenCalledWith(
                'POST',
                '/managers/ajax/pages/page.php',
                {
                    sn: 'Hitgrab',
                    hg_is_ajax: '1',
                    page_class: 'HunterProfile',
                    page_arguments: {
                        legacyMode: '',
                        tab: 'kings_crowns',
                        sub_tab: 'false',
                        snuid: '12345',
                    },
                    last_read_journal_entry_id: 123,
                    uh: 'test-uh',
                },
                false
            );
        });

        it('should handle API send errors gracefully', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = {
                sn: 'Hitgrab',
                hg_is_ajax: '1',
                page_class: 'HunterProfile',
                page_arguments: {
                    snuid: '12345'
                },
                last_read_journal_entry_id: '123',
                uh: 'test-uh'
            };

            const error = new Error('Network error');
            vi.mocked(mockApiService.send).mockImplementation(() => Promise.reject(error));

            await requestHandler({url, request, requestId: ''});

            // Wait for promise to resolve
            await vi.runAllTimersAsync();

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to send King\'s Crown request', error);
        });
    });

    describe('handleResponse', () => {
        beforeEach(() => {
            crownTracker.init();
        });

        const createKingsCrownRequest = (): RequestBody => ({
            page_class: 'HunterProfile',
            page_arguments: {
                tab: 'kings_crowns',
                snuid: '12345'
            },
            last_read_journal_entry_id: '123',
            uh: 'test-uh'
        });

        const createKingsCrownResponse = (): HgResponse => new HgResponseBuilder()
            .withPage({
                tabs: {
                    kings_crowns: {
                        subtabs: [
                            {
                                mouse_crowns: {
                                    user_name: 'TestUser',
                                    badge_groups: [
                                        {name: 'Test Bronze', type: 'bronze', count: 5},
                                        {name: 'Test Silver', type: 'silver', count: 3},
                                        {name: 'Test Gold', type: 'gold', count: 2},
                                        {name: 'Test Platinum', type: 'platinum', count: 1},
                                        {name: 'Test Diamond', type: 'diamond', count: 1},
                                        {type: 'none'}
                                    ]
                                }
                            }
                        ]
                    }
                }
            })
            .build();

        it('should ignore responses not from page.php', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/other.php');
            const request = createKingsCrownRequest();
            const response = createKingsCrownResponse();

            await responseHandler({url, request, response, requestId: ''});

            expect(crownTrackerWindowMessenger.sendMessage).not.toHaveBeenCalled();
        });

        it('should ignore responses that are not King\'s Crown requests', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = {
                page_class: 'HunterProfile',
                page_arguments: {
                    snuid: '12345'
                }
            };
            const response = createKingsCrownResponse();

            await responseHandler({url, request, response, requestId: ''});

            expect(crownTrackerWindowMessenger.sendMessage).not.toHaveBeenCalled();
        });

        it('should handle malformed response structure gracefully', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = createKingsCrownRequest();
            const response = new HgResponseBuilder().withPage({invalid: 'response'}).build();

            await responseHandler({url, request, response, requestId: ''});

            expect(mockLogger.debug).toHaveBeenCalledWith('Skipped crown submission due to unhandled XHR structure');
            expect(mockLogger.warn).toHaveBeenCalledWith(
                'Unhandled King\'s Crown response structure',
                expect.anything()
            );
            expect(mockExtensionLog.log).toHaveBeenCalledWith(
                LogLevel.Warn,
                'Unhandled King\'s Crown response structure',
                expect.anything()
            );
        });

        it('should process valid King\'s Crown response and submit to background', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = createKingsCrownRequest();
            const response = createKingsCrownResponse();

            const mockResult: CrownTrackerSubmitResult = {
                success: true,
                count: 12
            };

            vi.mocked(crownTrackerWindowMessenger.sendMessage).mockResolvedValue(mockResult);
            vi.spyOn(Date, 'now').mockReturnValue(123456000000);

            await responseHandler({url, request, response, requestId: ''});

            const expectedMessage: CrownData = {
                user: '12345',
                timestamp: 123456000, // Math.round(Date.now() / 1000)
                crowns: {
                    bronze: 5,
                    silver: 3,
                    gold: 2,
                    platinum: 1,
                    diamond: 1
                }
            };

            expect(mockLogger.debug).toHaveBeenCalledWith('Sending crowns payload to background: ', expectedMessage);
            expect(crownTrackerWindowMessenger.sendMessage).toHaveBeenCalledWith('submitCrowns', expectedMessage);
            expect(mockShowFlashMessage).toHaveBeenCalledWith('success', 'Submitted 12 crowns for TestUser to MHCC!');
        });

        it('should skip response if same snuid was already processed', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = createKingsCrownRequest();
            const response = createKingsCrownResponse();

            vi.mocked(crownTrackerWindowMessenger.sendMessage).mockResolvedValue({
                success: true,
                count: 0
            });

            // First request should go through
            await responseHandler({url, request, response, requestId: ''});
            expect(crownTrackerWindowMessenger.sendMessage).toHaveBeenCalledExactlyOnceWith('submitCrowns', expect.anything());
            vitest.clearAllMocks();

            // Second request with same snuid should be skipped
            await responseHandler({url, request, response, requestId: ''});
            expect(crownTrackerWindowMessenger.sendMessage).not.toHaveBeenCalled();
            expect(mockLogger.debug).toHaveBeenCalledWith('Skipping King\'s Crown request (already requested for this user)');
        });

        it('should handle crown submission failure', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = createKingsCrownRequest();
            const response = createKingsCrownResponse();

            const mockResult: CrownTrackerSubmitResult = {
                success: false,
                error: 'Server error'
            };

            vi.mocked(crownTrackerWindowMessenger.sendMessage).mockResolvedValue(mockResult);

            await responseHandler({url, request, response, requestId: ''});

            expect(mockShowFlashMessage).toHaveBeenCalledWith('error', 'Failed to submit crowns to MHCC: Server error');
        });

        it('should handle crown submission exception', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = createKingsCrownRequest();
            const response = createKingsCrownResponse();

            const error = new Error('Network error');
            vi.mocked(crownTrackerWindowMessenger.sendMessage).mockRejectedValue(error);

            await responseHandler({url, request, response, requestId: ''});

            expect(mockLogger.error).toHaveBeenCalledWith('Failed to submit crowns to MHCC', error);
            expect(mockShowFlashMessage).toHaveBeenCalledWith('error', 'Failed to submit crowns to MHCC: Network error');
        });

        it('should handle non-Error exceptions in crown submission', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = createKingsCrownRequest();
            const response = createKingsCrownResponse();

            vi.mocked(crownTrackerWindowMessenger.sendMessage).mockRejectedValue('String error');

            await responseHandler({url, request, response, requestId: ''});

            expect(mockShowFlashMessage).toHaveBeenCalledWith('error', 'Failed to submit crowns to MHCC: String error');
        });

        it('should handle response with badge groups containing only none type', async () => {
            const url = new URL('https://www.mousehuntgame.com/managers/ajax/pages/page.php');
            const request = createKingsCrownRequest();
            const response = new HgResponseBuilder()
                .withPage({
                    tabs: {
                        kings_crowns: {
                            subtabs: [
                                {
                                    mouse_crowns: {
                                        user_name: 'TestUser',
                                        badge_groups: [
                                            {type: 'none'},
                                            {type: 'none'}
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                })
                .build();

            vi.mocked(crownTrackerWindowMessenger.sendMessage).mockResolvedValue({
                success: true,
                count: 0
            });

            await responseHandler({url, request, response, requestId: ''});

            const expectedMessage = expect.objectContaining({
                user: '12345',
                timestamp: expect.any(Number),
                crowns: {
                    bronze: 0,
                    silver: 0,
                    gold: 0,
                    platinum: 0,
                    diamond: 0
                }
            });

            expect(crownTrackerWindowMessenger.sendMessage).toHaveBeenCalledWith('submitCrowns', expectedMessage);
        });
    });
});
