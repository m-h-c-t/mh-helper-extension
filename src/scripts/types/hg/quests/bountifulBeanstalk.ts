import {z} from "zod";

export const beanstalkAttributesSchema = z.object({
    in_castle: z.literal(false),
    beanstalk: z.object({
        is_boss_encounter: z.boolean(),
    }),
});

export const embellishmentSchema = z.object({
    type: z.union([
        z.literal("golden_key"),
        z.literal("golden_feather"),
        z.literal("ruby_remover"),
    ]),
    is_active: z.boolean(),
});

export const castleAttributesSchema = z.object({
    in_castle: z.literal(true),
    castle: z.object({
        is_boss_chase: z.boolean(),
        is_boss_encounter: z.boolean(),
        current_floor: z.object({
            type: z.string(),
            name: z.string(),
        }),
        current_room: z.object({
            type: z.string(),
            name: z.string(),
        }),
        next_room: z.object({
            type: z.string(),
            name: z.string(),
        }),
        room_position: z.coerce.number(),
    }),
    embellishments: z.array(embellishmentSchema),
});

export const questBountifulBeanstalkSchema = z.union([
    beanstalkAttributesSchema,
    castleAttributesSchema,
]);

export type BeanstalkAttributes = z.infer<typeof beanstalkAttributesSchema>;
export type CastleAttributes = z.infer<typeof castleAttributesSchema>;
export type Embellishment = z.infer<typeof embellishmentSchema>;
export type QuestBountifulBeanstalk = z.infer<typeof questBountifulBeanstalkSchema>;
