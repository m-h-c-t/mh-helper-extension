import {hgResponseSchema} from "@scripts/types/hg";
import {ValidatedAjaxSuccessHandler} from "./ajaxSuccessHandler";
import {z} from "zod";
import {SubmissionService} from "@scripts/services/submission.service";
import {LoggerService} from "@scripts/services/logging";


export class TreasureMapHandler extends ValidatedAjaxSuccessHandler {

    constructor(logger: LoggerService,
        private readonly submissionService: SubmissionService) {
        super(logger);
    }

    schema = hgResponseSchema.extend({
        treasure_map_inventory: z.object({
            relic_hunter_hint: z.string(),
        }).optional(),
        treasure_map: z.object({
            name: z.string().transform((name) => name
                .replace(/ treasure/i, '')
                .replace(/rare /i, '')
                .replace(/common /i, '')
                .replace(/Ardouous/i, 'Arduous'),
            ),
            map_id: z.coerce.number(),
            goals: z.object({
                mouse: z.array(z.object({
                    unique_id: z.coerce.number(),
                    name: z.string(),
                })),
            }),
        }).optional(),
    });

    match(url: string): boolean {
        return url.includes("mousehuntgame.com/managers/ajax/users/treasuremap_v2.php");
    }

    protected async validatedExecute(data: z.infer<typeof this.schema>): Promise<void> {

        const hint = data.treasure_map_inventory?.relic_hunter_hint;
        if (hint) {
            await this.submissionService.submitRelicHunterHint(hint);
        }

        const treasureMap = data.treasure_map;
        if (!treasureMap) {
            return;
        }

        // we don't support anything but mice related goals
        if (treasureMap.goals.mouse.length === 0) {
            return;
        }

        // create record of mice name by unique_id
        const mice = treasureMap.goals.mouse.reduce((acc, mouse) => {
            acc[mouse.unique_id] = mouse.name;
            return acc;
        }, {} as Record<number, string>);

        const map = {
            mice,
            id: treasureMap.map_id,
            name: treasureMap.name,
        };

        await this.submissionService.submitTreasureMap(map);
    }

}
