import type { ApiService } from '@scripts/services/api.service';

import { MouseRipApiService } from '@scripts/services/mouserip-api.service';
import { mock } from 'vitest-mock-extended';

describe('MouseRipApiService', () => {
    it('requests only the id, type, and name of every item', async () => {
        const apiService = mock<ApiService>();
        apiService.send.mockResolvedValue([{id: 80, type: 'brie_cheese', name: 'Brie Cheese'}]);

        const items = await new MouseRipApiService(apiService).getAllItems();

        expect(apiService.send).toHaveBeenCalledWith('GET', 'https://api.mouse.rip/items?fields=id,type,name', null, true);
        expect(items).toEqual([{id: 80, type: 'brie_cheese', name: 'Brie Cheese'}]);
    });
});
