# End-to-End Testing

The contents of this directory are to help test the core functionality of the extension (hunt + convertible submission) through fake HTTP calls.

Any HTTP calls that aren't properly mocked won't turn into real network requests since the [setup-env.ts](/tests/e2e/util/setup-env.ts) sets nock to throw if any calls try to connect. This file is run when vitest inits the environment from [vitest.config.js](/vitest.config.js).

## Template

A good starting point for any new file will look like this:

```typescript

import MockServer from './util/mockServer';

describe('test module description', () => {
    let server: MockServer;

    beforeEach(() => {
        server = new MockServer();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    it('is a test', () => {

    });
});
```
