import type { LoggerService } from '@scripts/services/logging';
import type { SubmissionService } from '@scripts/services/submission.service';
import type { HgItem } from '@scripts/types/mhct';
import type { z } from 'zod';

import { hgConvertibleResponseSchema } from '@scripts/types/hg';

import { ValidatedAjaxSuccessHandler } from './ajaxSuccessHandler';

export class UseConvertibleAjaxHandler extends ValidatedAjaxSuccessHandler {
    readonly name = 'Use Convertible';
    readonly schema = hgConvertibleResponseSchema;

    constructor(logger: LoggerService,
        private readonly submissionService: SubmissionService
    ) {
        super(logger);
    }

    match(url: string): boolean {
        return url.includes('mousehuntgame.com/managers/ajax/users/useconvertible.php');
    }

    protected async validatedExecute(data: z.infer<typeof this.schema>): Promise<void> {
        if (!data.convertible_open) {
            this.logger.info(`${this.name}: Likely that a treasure map was opened, skipping convertible submission`);
            return;
        }

        const convertibleType = data.convertible_open.type;
        if (!(convertibleType in data.items)) {
            this.logger.warn('Couldn\'t find any items from opened convertible');
            return;
        }

        // Use data.items because data.convertible_open will contain the pluralized name if multiple were opened
        const convertible: HgItem = {
            id: data.items[convertibleType].item_id,
            quantity: data.items[convertibleType].quantity,
            name: data.items[convertibleType].name,
        };

        if (!convertible) {
            this.logger.warn('Couldn\'t find any items from opened convertible');
            return;
        }

        const mapGoldPoint: Record<string, number> = {
            gold_stat_item: 431,
            point_stat_item: 644,
        };

        // verify that data.inventory is a record
        if (!data.inventory || Array.isArray(data.inventory)) {
            this.logger.warn('Inventory is not a record');
            return;
        }

        const items: HgItem[] = [];
        for (const convertibleItem of data.convertible_open.items) {
            if (convertibleItem.type in data.inventory) {
                items.push({
                    id: data.inventory[convertibleItem.type].item_id,
                    name: convertibleItem.name,
                    quantity: convertibleItem.quantity,
                });
            } else if (convertibleItem.type in mapGoldPoint) {
                items.push({
                    id: mapGoldPoint[convertibleItem.type],
                    name: convertibleItem.name,
                    quantity: convertibleItem.quantity,
                });
            } else {
                this.logger.warn(`Item ${convertibleItem.type} not found in inventory or custom map`);
                return;
            }
        }

        if (items.length === 0) {
            return;
        }

        await this.submissionService.submitItemConvertible(convertible, items);
    }
}
