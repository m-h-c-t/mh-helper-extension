export interface QuestQuesoGeyser {
    state: string // QuesoGeyserState
    state_name: string;
}

export const QuesoGeyserStates = [ 'collecting', 'corked', 'eruption', 'claim' ] as const;

export type QuesoGeyserState = typeof QuesoGeyserStates[number];
