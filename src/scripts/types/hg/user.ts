import {z} from "zod";
import {environmentAttributesSchema} from "./environmentAttributes";
import {viewingAttributesSchema} from "./viewingAttributes";
import {questsSchema} from "./quests";
import {zodStrumber} from "@scripts/util/zod";

export const userSchema = z.object({
    user_id: z.number(),
    sn_user_id: z.coerce.string(),
    unique_hash: z.string(),
    num_active_turns: z.number(),
    next_activeturn_seconds: z.number(),
    base_name: z.string(),
    base_item_id: zodStrumber,
    weapon_name: z.string(),
    weapon_item_id: zodStrumber,
    trinket_name: z.string().nullable(),
    trinket_item_id: zodStrumber.nullable(),
    bait_name: z.coerce.string(), // all bait_ fields all can be 0 if none equipped or ran out
    bait_item_id: zodStrumber,
    trap_power: z.coerce.number(),
    trap_power_bonus: z.coerce.number(),
    trap_luck: z.coerce.number(),
    trap_attraction_bonus: z.coerce.number(),
    has_shield: z.boolean(),
    environment_id: z.coerce.number(),
    quests: questsSchema,
    enviroment_atts: environmentAttributesSchema.optional(),
}).and(viewingAttributesSchema);

export type User = z.infer<typeof userSchema>;
