import { z } from 'zod';

import type { ApiService } from './api.service';

export class MouseRipApiService {
    constructor(
        private readonly apiService: ApiService
    ) {}

    async getAllItems(): Promise<MouseRipItem[]> {
        // Only request the fields in mouseRipItemSchema; the full item objects are ~20x larger.
        const response = await this.apiService.send('GET', 'https://api.mouse.rip/items?fields=id,type,name', null, true);

        return mouseRipItemSchema.array().parse(response);
    }
}

export const mouseRipItemSchema = z.object({
    id: z.number(),
    type: z.string(),
    name: z.string(),
});

export type MouseRipItem = z.infer<typeof mouseRipItemSchema>;
