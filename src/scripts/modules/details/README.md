# Details

Need to add a new details for to a hunt response?

First decide whether you need to add details for a specific location, an `IEnvironmentDetailer` or details that can happen anywhere, e.g. Pillaging, Lucky Catch, some annual events (Sprint Egg Hunt), an `IDetailer`.

1. Create a new file in the appropriate [environment](environment) or [global](global) folder. (You can use javascript but it's not recommended.)
2. Create a class in your new file that implements the appropriate interface.
   Or use one of these templates

    `IDetailer`

    ```typescript
    import { type User } from '@scripts/types/hg';
    import { type IDetailer } from '../details.types';

    export class <GlobalEvent>Detailer implements IDetailer {
        addDetails(message: any, userPre: User, userPost: User, journal: any): {} | undefined {

        }
    }
    ```

    `IEnvironmentDetailer`

    ```typescript
    import { type User } from '@scripts/types/hg';
    import { type IEnvironmentDetailer } from '../details.types';

    export class <Location>Detailer implements IEnvironmentDetailer {
        readonly environment: string = '<Location>';

        addDetails(message: any, userPre: User, userPost: User, journal: any): {} | undefined {

        }
    }
    ```

3. The `environment` field, if required, should return a string of the location , e.g., `"Valour Rift"` or `"Town of Gnawnia"`.
4. In the `getDetails` function, optionally return a record of details to add to the hunt otherwise do nothing.
   - `throw` an `Error` in this function (with a detailed message) if you encounter an unexpected state and wish to discard the hunt.
5. Add the detailer to [index.ts](index.ts).
6. Create your unit tests in the test folder!
