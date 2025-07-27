import {ValidatedAjaxSuccessHandler} from "./ajaxSuccessHandler";
import {SubmissionService} from "@scripts/services/submission.service";
import {hgResponseSchema} from "@scripts/types/hg";
import {HgItem} from "@scripts/types/mhct";
import {LoggerService} from "@scripts/util/logger";
import {z} from "zod";

export class UseConvertibleAjaxHandler extends ValidatedAjaxSuccessHandler {
    schema = hgResponseSchema.extend({
        convertible_open: z.object({
            type: z.string(),
            items: z.array(z.object({
                name: z.string(),
                pluralized_name: z.string(),
                quantity: z.coerce.number(),
                type: z.string(),
            })),
        }),
        items: z.record(z.string(), z.object({
            name: z.string(),
            item_id: z.coerce.number(),
            quantity: z.coerce.number(),
            type: z.string(),
        })),
    });

    constructor(logger: LoggerService,
        private readonly submissionService: SubmissionService
    ) {
        super(logger);
    }

    match(url: string): boolean {
        return url.includes("mousehuntgame.com/managers/ajax/users/useconvertible.php");
    }

    protected async validatedExecute(data: z.infer<typeof this.schema>): Promise<void> {
        const convertibleType = data.convertible_open.type;
        if (!(convertibleType in data.items)) {
            this.logger.warn("Couldn't find any items from opened convertible");
            return;
        }

        // Use data.items because data.convertible_open will contain the pluralized name if multiple were opened
        const convertible: HgItem = {
            id: data.items[convertibleType].item_id,
            quantity: data.items[convertibleType].quantity,
            name: data.items[convertibleType].name,
        };

        if (!convertible) {
            this.logger.warn("Couldn't find any items from opened convertible");
            return;
        }

        const mapGoldPoint: Record<string, number> = {
            gold_stat_item: 431,
            point_stat_item: 644,
        };

        // verify that data.inventory is a record
        if (!data.inventory || Array.isArray(data.inventory)) {
            this.logger.warn("Inventory is not a record");
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
