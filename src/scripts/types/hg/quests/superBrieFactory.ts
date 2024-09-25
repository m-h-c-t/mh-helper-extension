import {z} from "zod";

const roomTypeSchema = z.enum([
    "mixing_room",
    "break_room",
    "pumping_room",
    "quality_assurance_room",
]);

export const questSuperBrieFactorySchema = z.object({
    factory_atts: z.object({
        current_room: roomTypeSchema,
        boss_warning: z.boolean().nullable(),
    }),
});

export type RoomType = z.infer<typeof roomTypeSchema>;
export type QuestSuperBrieFactory = z.infer<typeof questSuperBrieFactorySchema>;
