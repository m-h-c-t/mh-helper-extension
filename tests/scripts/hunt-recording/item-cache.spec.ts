import type { InterceptorService, ResponseEventParams } from '@scripts/services/interceptor.service';
import type { LoggerService } from '@scripts/services/logging';
import type { MouseRipApiService } from '@scripts/services/mouserip-api.service';
import type { HgResponse } from '@scripts/types/hg';

import { ItemCache } from '@scripts/hunt-recording/item-cache';
import { HgResponseBuilder } from '@tests/utility/builders';
import { mock } from 'vitest-mock-extended';

describe('ItemCache', () => {
    let cache: ItemCache;
    let interceptor: ReturnType<typeof mock<InterceptorService>>;
    let mouseRipApi: ReturnType<typeof mock<MouseRipApiService>>;
    let logger: ReturnType<typeof mock<LoggerService>>;

    beforeEach(() => {
        interceptor = mock<InterceptorService>();
        mouseRipApi = mock<MouseRipApiService>();
        mouseRipApi.getAllItems.mockResolvedValue([]);
        logger = mock<LoggerService>();
        cache = new ItemCache(logger, interceptor, mouseRipApi);
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

    it('loads the mouse.rip item list once on init', async () => {
        mouseRipApi.getAllItems.mockResolvedValue([{id: 80, type: 'brie_cheese', name: 'Brie Cheese'}]);

        cache.init();
        await cache.ready;

        expect(mouseRipApi.getAllItems).toHaveBeenCalledOnce();
        expect(cache.get('brie_cheese')).toEqual({item_id: 80, name: 'Brie Cheese'});
    });

    it('prefers items already learned from an inventory over mouse.rip', async () => {
        mouseRipApi.getAllItems.mockResolvedValue([{id: 999, type: 'cursed_gold_stat_item', name: 'Stale Name'}]);
        cache.record(withInventory());

        cache.init();
        await cache.ready;

        expect(cache.get('cursed_gold_stat_item')).toEqual({item_id: 2, name: 'Cursed Gold'});
    });

    it('resolves ready and keeps working when mouse.rip fails', async () => {
        mouseRipApi.getAllItems.mockRejectedValue(new Error('offline'));

        cache.init();
        await cache.ready;
        cache.record(withInventory());

        expect(logger.warn).toHaveBeenCalledWith('Failed to load items from mouse.rip', expect.any(Error));
        expect(cache.get('cursed_gold_stat_item')).toEqual({item_id: 2, name: 'Cursed Gold'});
    });
});
