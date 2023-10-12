import {HgResponse} from "@scripts/types/hg";

export interface SpookyShuffleResponse extends HgResponse {
    memory_game: SpookyShuffleStatus;
}

export interface SpookyShuffleStatus {
    is_complete: true | null;
    is_upgraded: true | null;
    has_selected_testing_pair: boolean; // true on selection of the 2nd card
    reward_tiers: RewardTier[];
    title_range: TitleRange;
    cards: Card[];
}

interface RewardTier {
    type: TitleRange;
    name: string; // A readable/nice english string of the title range
}

const TitleRanges = [
    'novice_journeyman',
    'master_lord',
    'baron_duke',
    'grand_duke_plus',
] as const;

export type TitleRange = typeof TitleRanges[number];

type Card = {
    id: number;
    quantity: number | null;
    is_matched: true | null;
    is_tested_pair: true | null;
} & (KnownCard | UnknownCard);

interface KnownCard {
    name: string;
    is_revealed: true;
    quantity: number;
}

interface UnknownCard {
    name: null;
    is_revealed: false;
    quantity: null;
}
