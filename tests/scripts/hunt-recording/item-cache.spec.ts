import type { InterceptorService, ResponseEventParams } from '@scripts/services/interceptor.service';
import type { HgResponse } from '@scripts/types/hg';

import { ItemCache } from '@scripts/hunt-recording/item-cache';
import { HgResponseBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

describe('ItemCache', () => {
    let cache: ItemCache;
    const interceptor = mock<InterceptorService>();

    beforeEach(() => {
        cache = new ItemCache(interceptor);
    });

    const withInventory = (): HgResponse => new HgResponseBuilder()
        .withInventory({
            cursed_gold_stat_item: {item_id: 2, name: 'Cursed Gold', type: 'cursed_gold_stat_item', quantity: 10},
        })
        .build();

    it('returns undefined for unknown item types', () => {
        expect(cache.get('cursed_gold_stat_item')).toBeUndefined();
    });

    it('learns item id and name from an object inventory', () => {
        cache.record(withInventory());
        expect(cache.get('cursed_gold_stat_item')).toEqual({item_id: 2, name: 'Cursed Gold'});
    });

    it('keeps learned items when later responses have an empty array or no inventory', () => {
        cache.record(withInventory());
        cache.record(new HgResponseBuilder().withUnknown({inventory: []}).build());
        cache.record(new HgResponseBuilder().build());
        expect(cache.get('cursed_gold_stat_item')).toEqual({item_id: 2, name: 'Cursed Gold'});
    });

    it('records responses emitted by the interceptor after init', () => {
        cache.init();
        const call = interceptor.on.mock.calls.find(c => c[0] === 'response');
        expect(call).toBeDefined();
        const listener = call![1] as (params: ResponseEventParams) => void;
        listener({response: withInventory()} as ResponseEventParams);
        expect(cache.get('cursed_gold_stat_item')).toEqual({item_id: 2, name: 'Cursed Gold'});
    });
});
