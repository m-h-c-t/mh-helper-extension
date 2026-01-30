import { EnvironmentService } from '@scripts/services/environment.service';

describe('EnvironmentService', () => {
    let service: EnvironmentService;
    process.env.ENV = 'development';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getBaseUrl', () => {
        it('returns localhost URL when env is development', () => {
            service = new EnvironmentService();

            expect(service.getBaseUrl()).toBe('http://localhost:8080');
        });

        it('returns production URL when env is production', () => {
            process.env.ENV = 'production';
            service = new EnvironmentService();

            expect(service.getBaseUrl()).toBe('https://www.mhct.win');
        });
    });

    describe.each<{version: number, expectedBaseUrl: string}>([
        {version: 0, expectedBaseUrl: 'http://localhost:8080'},
        {version: 1, expectedBaseUrl: 'https://www.mhct.win'},
    ])('URL generation', ({version, expectedBaseUrl}) => {
        beforeEach(() => {
            // Setup a service with a resolved version
            process.env.ENV = version === 0 ? 'development' : 'production';
            service = new EnvironmentService();
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

        it('getErrorIntakeUrl returns correct endpoint', () => {
            expect(service.getErrorIntakeUrl()).toBe(`${expectedBaseUrl}/error_intake.php`);
        });

        it('getUuidUrl returns correct endpoint', () => {
            expect(service.getUuidUrl()).toBe(`${expectedBaseUrl}/uuid.php`);
        });
    });
});
