import {z} from "zod";
import {renderDataSchema} from "./renderData";

export const journalMarkupSchema = z.object({
    render_data: renderDataSchema,
    //publish_data: PublishData;
    //wall_actions: WallActions;
});

export type JournalMarkup = z.infer<typeof journalMarkupSchema>;
