export class EnvironmentService {
    getMainIntakeUrl(): string {
        return this.getBaseUrl() + '/intake.php';
    }

    getMapIntakeUrl(): string {
        return this.getBaseUrl() + '/map_intake.php';
    }

    getConvertibleIntakeUrl(): string {
        return this.getBaseUrl() + '/convertible_intake.php';
    }

    getMapHelperUrl(): string {
        return this.getBaseUrl() + '/maphelper.php';
    }

    getRhIntakeUrl(): string {
        return this.getBaseUrl() + '/rh_intake.php';
    }

    getRejectionIntakeUrl(): string {
        return this.getBaseUrl() + '/rejection_intake.php';
    }

    getErrorIntakeUrl(): string {
        return this.getBaseUrl() + '/error_intake.php';
    }

    getUuidUrl(): string {
        return this.getBaseUrl() + '/uuid.php';
    }

    getBaseUrl(): string {
        if (process.env.ENV === 'development') {
            // Use port from https://github.com/m-h-c-t/mh-hunt-helper/blob/main/docker-compose.yml.example by default
            return 'http://localhost:8080';
        }

        return 'https://www.mhct.win';
    }
}
