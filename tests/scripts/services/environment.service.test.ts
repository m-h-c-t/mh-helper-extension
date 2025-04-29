
import {EnvironmentService} from '@scripts/services/environment.service';

describe('EnvironmentService', () => {
    let service: EnvironmentService;
    let mockGetVersion: jest.Mock<number>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetVersion = jest.fn<number, []>();
    });

    describe('initialization', () => {
        it('calls getVersionAsync during initialization', () => {
            mockGetVersion.mockReturnValue(1);
            service = new EnvironmentService(mockGetVersion);
            expect(mockGetVersion).toHaveBeenCalledTimes(1);
        });
    });

    describe('getBaseUrl', () => {
        it('returns localhost URL when version is undefined', () => {
            mockGetVersion.mockReturnValue(undefined as unknown as number);
            service = new EnvironmentService(mockGetVersion);

            expect(service.getBaseUrl()).toBe('http://localhost');
        });

        it('returns localhost URL when version is 0', () => {
            mockGetVersion.mockReturnValue(0);
            service = new EnvironmentService(mockGetVersion);

            expect(service.getBaseUrl()).toBe('http://localhost');
        });

        it('returns production URL when version is a positive number', () => {
            mockGetVersion.mockReturnValue(123);
            service = new EnvironmentService(mockGetVersion);

            expect(service.getBaseUrl()).toBe('https://www.mhct.win');
        });
    });

    describe.each<{version: number, expectedBaseUrl: string}>([
        {version: 0, expectedBaseUrl: 'http://localhost'},
        {version: 1, expectedBaseUrl: 'https://www.mhct.win'},
    ])('URL generation', ({version, expectedBaseUrl}) => {
        beforeEach(() => {
            // Setup a service with a resolved version
            mockGetVersion.mockReturnValue(version);
            service = new EnvironmentService(mockGetVersion);
        });

        it('getMainIntakeUrl returns correct endpoint', () => {
            expect(service.getMainIntakeUrl()).toBe(`${expectedBaseUrl}/intake.php`);
        });

        it('getMapIntakeUrl returns correct endpoint', () => {
            expect(service.getMapIntakeUrl()).toBe(`${expectedBaseUrl}/map_intake.php`);
        });

        it('getConvertibleIntakeUrl returns correct endpoint', () => {
            expect(service.getConvertibleIntakeUrl()).toBe(`${expectedBaseUrl}/convertible_intake.php`);
        });

        it('getMapHelperUrl returns correct endpoint', () => {
            expect(service.getMapHelperUrl()).toBe(`${expectedBaseUrl}/maphelper.php`);
        });

        it('getRhIntakeUrl returns correct endpoint', () => {
            expect(service.getRhIntakeUrl()).toBe(`${expectedBaseUrl}/rh_intake.php`);
        });

        it('getRejectionIntakeUrl returns correct endpoint', () => {
            expect(service.getRejectionIntakeUrl()).toBe(`${expectedBaseUrl}/rejection_intake.php`);
        });

        it('getUuidUrl returns correct endpoint', () => {
            expect(service.getUuidUrl()).toBe(`${expectedBaseUrl}/uuid.php`);
        });
    });
});
