import { z } from 'zod';

import type { ApiService } from './api.service';

export class MouseRipApiService {
    constructor(
        private readonly apiService: ApiService
    ) {}

    async getAllItems(): Promise<MouseRipItem[]> {
        const response = await this.apiService.send('GET', 'https://api.mouse.rip/items', null, true, headers => this.alterHeaders(headers));

        return mouseRipItemSchema.array().parse(response);
    }

    private alterHeaders(headers: Headers): void {
        headers.set('X-Requested-With', 'MHCT');
    }
}

export const mouseRipItemSchema = z.object({
    id: z.number(),
    type: z.string(),
    name: z.string(),
});

export type MouseRipItem = z.infer<typeof mouseRipItemSchema>;
