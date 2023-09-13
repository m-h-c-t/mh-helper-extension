import {HgResponse} from "@scripts/types/hg";

export interface KingsGiveawayResponse extends HgResponse {
    kings_giveaway: KingsGiveawayStatus;
    kings_giveaway_result: KingsGiveawayResult;
}

export interface KingsGiveawayStatus {
    remaining_openable_prize_packs: number | null;
    vault_is_open: true | null;
    vault_prizes: {
            quantity: string | number;
            type: string;
            name: string;
        }[] | [];
}

export interface KingsGiveawayResult {
    quantity: number | string;
    slot: string;
    items: {
        name: string;
        quantity: number | string;
        type: string;
    }[]
}
