import {SubmissionService} from '@scripts/services/submission.service';
import {LoggerService} from "@scripts/services/logging";
import {EnvironmentService} from '@scripts/services/environment.service';
import {ApiService} from '@scripts/services/api.service';
import {HgItem, IntakeMessage} from '@scripts/types/mhct';
import * as timeUtils from '@scripts/util/time';
import {mock} from 'jest-mock-extended';

// Mock dependencies
jest.mock('@scripts/services/environment.service');
jest.mock('@scripts/services/api.service');
jest.mock('@scripts/util/time');

describe('SubmissionService', () => {
    const mockLogger = mock<LoggerService>();
    let service: SubmissionService;
    let mockEnvironmentService: jest.Mocked<EnvironmentService>;
    let mockApiService: jest.Mocked<ApiService>;
    let mockGetSettings: jest.Mock;
    let mockGetBasicInfo: jest.Mock;
    let mockShowFlashMessage: jest.Mock;
    let mockUserSettings: Record<string, boolean>;

    const mockHunterInfo = {
        hunter_id_hash: 'test-hunter-hash',
        mhhh_version: 123
    };

    const testTimestamp = 1674000000;

    beforeEach(() => {
        jest.clearAllMocks();

        mockEnvironmentService = {
            getConvertibleIntakeUrl: jest.fn().mockReturnValue('convert-url'),
            getMainIntakeUrl: jest.fn().mockReturnValue('main-url'),
            getRejectionIntakeUrl: jest.fn().mockReturnValue('rejection-url'),
            getRhIntakeUrl: jest.fn().mockReturnValue('rh-url'),
            getMapIntakeUrl: jest.fn().mockReturnValue('map-url'),
            getUuidUrl: jest.fn().mockReturnValue('uuid-url')
        } as unknown as jest.Mocked<EnvironmentService>;

        mockApiService = {
            send: jest.fn().mockImplementation((method, url, body) => {
                if (url === 'uuid-url') {
                    return Promise.resolve('test-uuid');
                } else {
                    return Promise.resolve({success: true, message: 'Success message', status: 'success'});
                }
            })
        } as unknown as jest.Mocked<ApiService>;

        mockUserSettings = {
            'tracking-events': true,
            'tracking-convertibles': true
        };

        mockGetSettings = jest.fn().mockResolvedValue(mockUserSettings);
        mockGetBasicInfo = jest.fn().mockReturnValue(mockHunterInfo);
        mockShowFlashMessage = jest.fn();

        jest.spyOn(timeUtils, 'getUnixTimestamp').mockReturnValue(testTimestamp);

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
                jest.fn().mockResolvedValue(mockUserSettings),
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
                jest.fn().mockResolvedValue(mockUserSettings),
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
                jest.fn().mockResolvedValue(mockUserSettings),
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
                jest.fn().mockResolvedValue(mockUserSettings),
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
                jest.fn().mockResolvedValue(mockUserSettings),
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

        beforeEach(() => {
            mockEnvironmentService.getRejectionIntakeUrl = jest.fn().mockReturnValue('rejection-url');
        });

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
                jest.fn().mockResolvedValue(mockUserSettings),
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

    describe('error handling', () => {
        const convertible: HgItem = {id: 1, name: 'Test Convertible', quantity: 1};
        const items: HgItem[] = [{id: 2, name: 'Test Item', quantity: 5}];

        it('logs error when UUID request fails', async () => {
            mockApiService.send.mockImplementation((method, url, body) => {
                if (url === 'uuid-url') {
                    return Promise.reject(new Error("UUID request failed"));
                }
                return Promise.resolve({});
            });

            await service.submitEventConvertible(convertible, items);

            expect(mockLogger.error).toHaveBeenCalledWith(
                "An error occurred while submitting to MHCT",
                new Error("UUID request failed")
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
