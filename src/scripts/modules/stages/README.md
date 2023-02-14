# Stages

Need to add a new stage for a location?

1. Create a new `<location>.ts` file. Where `<location>` is typically the new location name. (You can use javascript but it's not recommended.)
2. Create a class in your new file that implements `IStager`.
   Or use this template

    ```typescript
    import { type User } from '@scripts/types/hg';
    import { type IStager } from './stages.types';

    export class <Location>Stager implements IStager {
        readonly environment: string = '<Location>';

        addStage(message: any, userPre: User, userPost: User, journal: any): void {
          // assign message.stage
          // can be string or { key: value }

          // examples
          // message.stage = "Boss"
          // message.stage = { one: 2, three: 4 }
        }
    }
    ```

3. The `environment` field should return a string of the location , e.g., `"Valour Rift"` or `"Town of Gnawnia"`.
4. In the `addStage` function, assign the `stage` field on the object `message` which is passed as an argument.
   - `throw` an `Error` in this function (with a detailed message) if you encounter an unexpected state and wish to discard the hunt.
5. Add the stager to [index.ts](index.ts).
6. Create your unit tests in the test folder!
