import type { ApiService } from '@scripts/services/api.service';
import type { EnvironmentService } from '@scripts/services/environment.service';
import type { LoggerService } from '@scripts/services/logging';
import type { HgItem, IntakeMessage } from '@scripts/types/mhct';

import { SubmissionService } from '@scripts/services/submission.service';
import * as timeUtils from '@scripts/util/time';
import { mock } from 'vitest-mock-extended';

describe('SubmissionService', () => {
    let service: SubmissionService;
    const mockLogger = mock<LoggerService>();
    const mockEnvironmentService = mock<EnvironmentService>();
    const mockApiService = mock<ApiService>();
    const mockGetSettings = vi.fn();
    const mockGetBasicInfo = vi.fn();
    const mockShowFlashMessage = vi.fn();
    let mockUserSettings: Record<string, boolean>;

    const mockHunterInfo = {
        hunter_id_hash: 'test-hunter-hash',
        mhhh_version: 123
    };

    const testTimestamp = 1674000000;

    beforeEach(() => {
        vi.clearAllMocks();

        mockEnvironmentService.getConvertibleIntakeUrl.mockReturnValue('convert-url');
        mockEnvironmentService.getMainIntakeUrl.mockReturnValue('main-url');
        mockEnvironmentService.getRejectionIntakeUrl.mockReturnValue('rejection-url');
        mockEnvironmentService.getRhIntakeUrl.mockReturnValue('rh-url');
        mockEnvironmentService.getMapIntakeUrl.mockReturnValue('map-url');
        mockEnvironmentService.getUuidUrl.mockReturnValue('uuid-url');

        mockApiService.send.mockImplementation((method, url, body) => {
            if (url === 'uuid-url') {
                return Promise.resolve('test-uuid');
            } else {
                return Promise.resolve({success: true, message: 'Success message', status: 'success'});
            }
        });

        mockUserSettings = {
            'tracking-events': true,
            'tracking-convertibles': true
        };

        mockGetSettings.mockResolvedValue(mockUserSettings);
        mockGetBasicInfo.mockReturnValue(mockHunterInfo);

        vi.spyOn(timeUtils, 'getUnixTimestamp').mockReturnValue(testTimestamp);

        // Create the service instance
        service = new SubmissionService(
            mockLogger,
            mockEnvironmentService,
            mockApiService,
            mockGetSettings,
            mockGetBasicInfo,
            mockShowFlashMessage
        );
    });

    describe('initialization', () => {
        it('fetches user settings on initialization', () => {
            expect(mockGetSettings).toHaveBeenCalled();
        });
    });

    describe('submitEventConvertible', () => {
        // use item_id instead of id for convertible to test mapping
        const convertible: HgItem = {item_id: 1, name: 'Test Convertible', quantity: 1} as unknown as HgItem;
        const items: HgItem[] = [{id: 2, name: 'Test Item', quantity: 5}];

        it('submits event convertible when tracking-events is enabled', async () => {
            await service.submitEventConvertible(convertible, items);

            expect(mockEnvironmentService.getUuidUrl).toHaveBeenCalled();
            expect(mockEnvironmentService.getConvertibleIntakeUrl).toHaveBeenCalled();
            expect(mockApiService.send).toHaveBeenCalledTimes(2);

            // Verify first API call (UUID)
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                1,
                'POST',
                'uuid-url',
                expect.objectContaining({
                    hunter_id_hash: mockHunterInfo.hunter_id_hash,
                    extension_version: mockHunterInfo.mhhh_version,
                    entry_timestamp: testTimestamp
                }),
                true
            );

            // Verify second API call (submission)
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                2,
                'POST',
                'convert-url',
                expect.objectContaining({
                    convertible: expect.objectContaining({id: 1, name: 'Test Convertible', quantity: 1}),
                    items: expect.arrayContaining(items),
                    uuid: 'test-uuid',
                    hunter_id_hash: mockHunterInfo.hunter_id_hash,
                    extension_version: mockHunterInfo.mhhh_version,
                    entry_timestamp: testTimestamp,
                }),
                true
            );

            expect(mockShowFlashMessage).toHaveBeenCalledWith('success', 'Success message');
        });

        it('does not submit when tracking-events is disabled', async () => {
            mockUserSettings['tracking-events'] = false;

            // Create a new instance with updated settings
            service = new SubmissionService(
                mockLogger,
                mockEnvironmentService,
                mockApiService,
                vi.fn().mockResolvedValue(mockUserSettings),
                mockGetBasicInfo,
                mockShowFlashMessage
            );

            // Wait for settings to be applied
            await new Promise(resolve => setTimeout(resolve, 0));

            await service.submitEventConvertible(convertible, items);

            expect(mockApiService.send).not.toHaveBeenCalled();
            expect(mockShowFlashMessage).not.toHaveBeenCalled();
        });
    });

    describe('submitItemConvertible', () => {
        const convertible: HgItem = {id: 3, name: 'Item Convertible', quantity: 1};
        const items: HgItem[] = [{id: 4, name: 'Resulting Item', quantity: 3}];

        it('submits item convertible when tracking-convertibles is enabled', async () => {
            await service.submitItemConvertible(convertible, items);

            expect(mockEnvironmentService.getUuidUrl).toHaveBeenCalled();
            expect(mockEnvironmentService.getConvertibleIntakeUrl).toHaveBeenCalled();
            expect(mockApiService.send).toHaveBeenCalledTimes(2);
            expect(mockShowFlashMessage).toHaveBeenCalledWith('success', 'Success message');
        });

        it('does not submit when tracking-convertibles is disabled', async () => {
            mockUserSettings['tracking-convertibles'] = false;

            service = new SubmissionService(
                mockLogger,
                mockEnvironmentService,
                mockApiService,
                vi.fn().mockResolvedValue(mockUserSettings),
                mockGetBasicInfo,
                mockShowFlashMessage
            );

            await new Promise(resolve => setTimeout(resolve, 0));

            await service.submitItemConvertible(convertible, items);

            expect(mockApiService.send).not.toHaveBeenCalled();
        });
    });

    describe('submitRelicHunterHint', () => {
        const hint = 'Test Hint';

        it('submits relic hunter hint when tracking-events is enabled', async () => {
            await service.submitRelicHunterHint(hint);

            expect(mockEnvironmentService.getRhIntakeUrl).toHaveBeenCalled();
            expect(mockApiService.send).toHaveBeenCalledTimes(2);
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                2,
                'POST',
                'rh-url',
                expect.objectContaining({
                    hint,
                    uuid: 'test-uuid',
                    hunter_id_hash: mockHunterInfo.hunter_id_hash,
                    extension_version: mockHunterInfo.mhhh_version,
                    entry_timestamp: testTimestamp
                }),
                true
            );
        });

        it('does not submit when tracking-events is disabled', async () => {
            mockUserSettings['tracking-events'] = false;

            service = new SubmissionService(
                mockLogger,
                mockEnvironmentService,
                mockApiService,
                vi.fn().mockResolvedValue(mockUserSettings),
                mockGetBasicInfo,
                mockShowFlashMessage
            );

            await new Promise(resolve => setTimeout(resolve, 0));

            await service.submitRelicHunterHint(hint);

            expect(mockApiService.send).not.toHaveBeenCalled();
        });
    });

    describe('submitTreasureMap', () => {
        const map = {
            mice: {1: 'Mouse1', 2: 'Mouse2'},
            id: 101,
            name: 'Test Map'
        };

        it('submits treasure map when tracking-convertibles is true', async () => {
            await service.submitTreasureMap(map);

            expect(mockEnvironmentService.getMapIntakeUrl).toHaveBeenCalled();
            expect(mockApiService.send).toHaveBeenCalledTimes(2);
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                2,
                'POST',
                'map-url',
                expect.objectContaining({
                    ...map,
                    uuid: 'test-uuid',
                    hunter_id_hash: mockHunterInfo.hunter_id_hash,
                    extension_version: mockHunterInfo.mhhh_version,
                    entry_timestamp: testTimestamp
                }),
                true
            );
        });

        it('does not submit when tracking-convertibles is not true', async () => {
            mockUserSettings['tracking-convertibles'] = false;

            service = new SubmissionService(
                mockLogger,
                mockEnvironmentService,
                mockApiService,
                vi.fn().mockResolvedValue(mockUserSettings),
                mockGetBasicInfo,
                mockShowFlashMessage
            );

            await new Promise(resolve => setTimeout(resolve, 0));

            await service.submitTreasureMap(map);

            expect(mockApiService.send).not.toHaveBeenCalled();
        });
    });

    describe('submitHunt', () => {
        const hunt = {
            mouse: 'Test Mouse',
            location: 'Test Location',
            timestamp: testTimestamp,
            loot: 'Test Loot'
        } as unknown as IntakeMessage;

        it('submits hunt data when tracking-hunts is enabled', async () => {
            await service.submitHunt(hunt);

            expect(mockEnvironmentService.getUuidUrl).toHaveBeenCalled();
            expect(mockEnvironmentService.getMainIntakeUrl).toHaveBeenCalled();
            expect(mockApiService.send).toHaveBeenCalledTimes(2);

            // Verify first API call (UUID)
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                1,
                'POST',
                'uuid-url',
                expect.objectContaining({
                    hunter_id_hash: mockHunterInfo.hunter_id_hash,
                    extension_version: mockHunterInfo.mhhh_version,
                    entry_timestamp: testTimestamp
                }),
                true
            );

            // Verify second API call (submission)
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                2,
                'POST',
                'main-url',
                expect.objectContaining({
                    ...hunt,
                    uuid: 'test-uuid',
                    hunter_id_hash: mockHunterInfo.hunter_id_hash,
                    extension_version: mockHunterInfo.mhhh_version,
                    entry_timestamp: testTimestamp
                }),
                true
            );

            expect(mockShowFlashMessage).toHaveBeenCalledWith('success', 'Success message');
        });

        it('does not submit when tracking-hunts is disabled', async () => {
            mockUserSettings['tracking-hunts'] = false;

            service = new SubmissionService(
                mockLogger,
                mockEnvironmentService,
                mockApiService,
                vi.fn().mockResolvedValue(mockUserSettings),
                mockGetBasicInfo,
                mockShowFlashMessage
            );

            // Wait for settings to be applied
            await new Promise(resolve => setTimeout(resolve, 0));

            await service.submitHunt(hunt);

            expect(mockApiService.send).not.toHaveBeenCalled();
            expect(mockShowFlashMessage).not.toHaveBeenCalled();
        });
    });

    describe('submitRejection', () => {
        const rejection = {
            reason: 'Test Rejection',
            data: {
                mouse: 'Test Mouse',
                timestamp: testTimestamp
            }
        };

        it('submits rejection data when tracking-hunts is enabled', async () => {
            await service.submitRejection(rejection);

            expect(mockEnvironmentService.getUuidUrl).toHaveBeenCalled();
            expect(mockEnvironmentService.getRejectionIntakeUrl).toHaveBeenCalled();
            expect(mockApiService.send).toHaveBeenCalledTimes(2);

            // Verify first API call (UUID)
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                1,
                'POST',
                'uuid-url',
                expect.objectContaining({
                    hunter_id_hash: mockHunterInfo.hunter_id_hash,
                    extension_version: mockHunterInfo.mhhh_version,
                    entry_timestamp: testTimestamp
                }),
                true
            );

            // Verify second API call (submission)
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                2,
                'POST',
                'rejection-url',
                expect.objectContaining({
                    ...rejection,
                    uuid: 'test-uuid',
                    hunter_id_hash: mockHunterInfo.hunter_id_hash,
                    extension_version: mockHunterInfo.mhhh_version,
                    entry_timestamp: testTimestamp
                }),
                true
            );

            expect(mockShowFlashMessage).toHaveBeenCalledWith('success', 'Success message');
        });

        it('does not submit when tracking-hunts is disabled', async () => {
            mockUserSettings['tracking-hunts'] = false;

            service = new SubmissionService(
                mockLogger,
                mockEnvironmentService,
                mockApiService,
                vi.fn().mockResolvedValue(mockUserSettings),
                mockGetBasicInfo,
                mockShowFlashMessage
            );

            // Wait for settings to be applied
            await new Promise(resolve => setTimeout(resolve, 0));

            await service.submitRejection(rejection);

            expect(mockApiService.send).not.toHaveBeenCalled();
            expect(mockShowFlashMessage).not.toHaveBeenCalled();
        });
    });

    describe('submitZodError', () => {
        it('respects the tracking-errors setting', async () => {
            mockUserSettings['tracking-errors'] = false;

            service = new SubmissionService(
                mockLogger,
                mockEnvironmentService,
                mockApiService,
                vi.fn().mockResolvedValue(mockUserSettings),
                mockGetBasicInfo,
                mockShowFlashMessage
            );

            await new Promise(resolve => setTimeout(resolve, 0));

            const issues = [{path: ['field'], message: 'Invalid'}];
            await service.submitZodError('test-url', issues, {});

            expect(mockApiService.send).not.toHaveBeenCalled();
        });

        it('submits error to the correct endpoint and does not show flash message', async () => {
            mockEnvironmentService.getErrorIntakeUrl.mockReturnValue('error-url');
            mockUserSettings['tracking-errors'] = true;

            mockApiService.send.mockClear();
            mockApiService.send.mockImplementation((method, url, body) => {
                if (url === 'uuid-url') {
                    return Promise.resolve('test-uuid');
                } else {
                    return Promise.resolve({success: true, message: 'Success message', status: 'success'});
                }
            });

            service = new SubmissionService(
                mockLogger,
                mockEnvironmentService,
                mockApiService,
                vi.fn().mockResolvedValue(mockUserSettings),
                mockGetBasicInfo,
                mockShowFlashMessage
            );

            await new Promise(resolve => setTimeout(resolve, 0));

            const issues = [{path: ['field'], message: 'Invalid'}];
            const context = {someContext: 'value'};
            await service.submitZodError('test-url', issues, context);

            expect(mockEnvironmentService.getErrorIntakeUrl).toHaveBeenCalled();
            // Should be 2 calls: 1 for UUID, 1 for error submission
            expect(mockApiService.send).toHaveBeenCalledTimes(2);

            // Verify the error submission call
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                2,
                'POST',
                'error-url',
                expect.objectContaining({
                    url: 'test-url',
                    issues: JSON.stringify(issues),
                    context: JSON.stringify(context),
                    uuid: 'test-uuid',
                    hunter_id_hash: mockHunterInfo.hunter_id_hash,
                    extension_version: mockHunterInfo.mhhh_version,
                    entry_timestamp: testTimestamp
                }),
                true
            );

            // Verify flash message was NOT shown (because showFlashMessage=false was passed to postData)
            expect(mockShowFlashMessage).not.toHaveBeenCalled();
        });

        it('includes url, issues, and context properties in submission', async () => {
            mockEnvironmentService.getErrorIntakeUrl.mockReturnValue('error-url');
            mockUserSettings['tracking-errors'] = true;

            mockApiService.send.mockClear();
            mockApiService.send.mockImplementation((method, url, body) => {
                if (url === 'uuid-url') {
                    return Promise.resolve('test-uuid');
                } else {
                    return Promise.resolve({success: true, message: 'Success message', status: 'success'});
                }
            });

            service = new SubmissionService(
                mockLogger,
                mockEnvironmentService,
                mockApiService,
                vi.fn().mockResolvedValue(mockUserSettings),
                mockGetBasicInfo,
                mockShowFlashMessage
            );

            await new Promise(resolve => setTimeout(resolve, 0));

            const issues = [
                {path: ['field1'], message: 'Required'},
                {path: ['field2'], message: 'Invalid type'}
            ];
            const context = {someData: 'test'};
            await service.submitZodError('test-url', issues, context);

            expect(mockApiService.send).toHaveBeenNthCalledWith(
                2,
                'POST',
                'error-url',
                expect.objectContaining({
                    url: 'test-url',
                    issues: JSON.stringify(issues),
                    context: JSON.stringify(context)
                }),
                true
            );
        });

        it('properly deduplicates duplicate errors', async () => {
            mockEnvironmentService.getErrorIntakeUrl.mockReturnValue('error-url');
            mockUserSettings['tracking-errors'] = true;

            mockApiService.send.mockClear();
            mockApiService.send.mockImplementation((method, url, body) => {
                if (url === 'uuid-url') {
                    return Promise.resolve('test-uuid');
                } else {
                    return Promise.resolve({success: true, message: 'Success message', status: 'success'});
                }
            });

            service = new SubmissionService(
                mockLogger,
                mockEnvironmentService,
                mockApiService,
                vi.fn().mockResolvedValue(mockUserSettings),
                mockGetBasicInfo,
                mockShowFlashMessage
            );

            await new Promise(resolve => setTimeout(resolve, 0));

            const issues = [{path: ['field'], message: 'Invalid'}];
            const context = {};

            // Submit the same error twice
            await service.submitZodError('test-url', issues, context);
            await service.submitZodError('test-url', issues, context);

            // Should only make 2 calls total: 1 UUID call + 1 error submission
            // The second submitZodError call should be skipped due to deduplication
            expect(mockApiService.send).toHaveBeenCalledTimes(2);

            // Verify the first call is UUID
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                1,
                'POST',
                'uuid-url',
                expect.any(Object),
                true
            );

            // Verify only one error submission
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                2,
                'POST',
                'error-url',
                expect.objectContaining({
                    url: 'test-url',
                    issues: JSON.stringify(issues),
                    context: JSON.stringify(context)
                }),
                true
            );
        });

        it('submits different errors even with different issues', async () => {
            mockEnvironmentService.getErrorIntakeUrl.mockReturnValue('error-url');
            mockUserSettings['tracking-errors'] = true;

            mockApiService.send.mockClear();
            mockApiService.send.mockImplementation((method, url, body) => {
                if (url === 'uuid-url') {
                    return Promise.resolve('test-uuid');
                } else {
                    return Promise.resolve({success: true, message: 'Success message', status: 'success'});
                }
            });

            service = new SubmissionService(
                mockLogger,
                mockEnvironmentService,
                mockApiService,
                vi.fn().mockResolvedValue(mockUserSettings),
                mockGetBasicInfo,
                mockShowFlashMessage
            );

            await new Promise(resolve => setTimeout(resolve, 0));

            const issues1 = [{path: ['field1'], message: 'Invalid'}];
            const issues2 = [{path: ['field2'], message: 'Invalid'}];
            const context = {};

            await service.submitZodError('test-url', issues1, context);
            await service.submitZodError('test-url', issues2, context);

            // Should make 4 calls total: 2 UUID calls + 2 error submissions
            expect(mockApiService.send).toHaveBeenCalledTimes(4);

            // Verify first error submission
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                2,
                'POST',
                'error-url',
                expect.objectContaining({
                    url: 'test-url',
                    issues: JSON.stringify(issues1),
                    context: JSON.stringify(context)
                }),
                true
            );

            // Verify second error submission
            expect(mockApiService.send).toHaveBeenNthCalledWith(
                4,
                'POST',
                'error-url',
                expect.objectContaining({
                    url: 'test-url',
                    issues: JSON.stringify(issues2),
                    context: JSON.stringify(context)
                }),
                true
            );
        });
    });

    describe('error handling', () => {
        const convertible: HgItem = {id: 1, name: 'Test Convertible', quantity: 1};
        const items: HgItem[] = [{id: 2, name: 'Test Item', quantity: 5}];

        it('logs error when UUID request fails', async () => {
            mockApiService.send.mockImplementation((method, url, body) => {
                if (url === 'uuid-url') {
                    return Promise.reject(new Error('UUID request failed'));
                }
                return Promise.resolve({});
            });

            await service.submitEventConvertible(convertible, items);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'An error occurred while submitting to MHCT',
                new Error('UUID request failed')
            );
            expect(mockApiService.send).toHaveBeenCalledTimes(1);
        });

        it('handles invalid response format gracefully', async () => {
            mockApiService.send.mockImplementation((method, url) => {
                if (url === 'uuid-url') {
                    return Promise.resolve({
                        ok: true,
                        text: () => Promise.resolve('test-uuid')
                    }) as unknown as Promise<Response>;
                } else {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({invalid: 'response'})
                    }) as unknown as Promise<Response>;
                }
            });

            await service.submitEventConvertible(convertible, items);

            expect(mockApiService.send).toHaveBeenCalledTimes(2);
            expect(mockShowFlashMessage).not.toHaveBeenCalled();
        });
    });
});
