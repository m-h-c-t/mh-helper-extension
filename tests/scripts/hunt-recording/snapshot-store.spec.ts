import type { InterceptorService, ResponseEventParams } from '@scripts/services/interceptor.service';

import { getMaxEntryId } from '@scripts/hunt-recording/journal';
import { SnapshotStore } from '@scripts/hunt-recording/snapshot-store';
import { HgResponseBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

describe('SnapshotStore', () => {
    let store: SnapshotStore;
    const interceptor = mock<InterceptorService>();

    beforeEach(() => {
        store = new SnapshotStore(interceptor);
    });

    const qualifying = () => new HgResponseBuilder().withAuras({}).build();

    it('returns null before any qualifying response', () => {
        expect(store.latest()).toBeNull();
    });

    it('keeps the latest response with user and trap_image', () => {
        const a = qualifying();
        const b = qualifying();
        store.record(a);
        store.record(b);
        expect(store.latest()).toEqual({response: b, maxEntryId: getMaxEntryId(b)});
    });

    it('ignores responses without trap_image', () => {
        const a = qualifying();
        const noTrapImage = new HgResponseBuilder().build();
        store.record(a);
        store.record(noTrapImage);
        expect(store.latest()?.response).toBe(a);
    });

    it('records responses emitted by the interceptor after init', () => {
        store.init();
        const call = interceptor.on.mock.calls.find(c => c[0] === 'response');
        expect(call).toBeDefined();
        const listener = call![1] as (params: ResponseEventParams) => void;
        const response = qualifying();
        listener({response} as ResponseEventParams);
        expect(store.latest()?.response).toBe(response);
    });
});
