import {HgResponse} from "@scripts/types/hg";

export interface KingsGiveawayResponse extends HgResponse {
    kings_giveaway_result: KingsGiveawayResult
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
