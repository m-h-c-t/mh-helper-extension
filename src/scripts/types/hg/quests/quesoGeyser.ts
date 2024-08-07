import {z} from "zod";

export const QuesoGeyserStates = [ 'collecting', 'corked', 'eruption', 'claim' ] as const;
const quesoGeyserStateSchema = z.enum(QuesoGeyserStates);

export const questQuesoGeyserSchema = z.object({
    state: quesoGeyserStateSchema,
    state_name: z.string(),
});

export type QuesoGeyserState = typeof QuesoGeyserStates[number];
export type QuestQuesoGeyser = z.infer<typeof questQuesoGeyserSchema>;
