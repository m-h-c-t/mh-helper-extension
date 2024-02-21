import type {HgResponse} from "@scripts/types/hg";

export interface HgResponseWithVendingMachine extends HgResponse {
    vending_machine_purchase?: VendingMachinePurchase
}

export interface VendingMachinePurchase {
    quantity: number;
    type: VendingMachinePurchaseType;
    items: VendingMachineItem[];
}

export type VendingMachinePurchaseType =
    "larry_starter_mix_snack_pack" |
    "tribal_crunch_snack_pack" |
    "wild_west_ranch_rings_snack_pack" |
    "sandy_bert_bites_snack_pack" |
    "hollow_heights_party_pack_snack_pack" |
    "riftios_snack_pack" |
    "story_seeds_snack_pack" |
    "bountiful_beans_snack_pack";

export interface VendingMachineItem {
    name: string;
    quantity: number;
    is_epic: boolean | null;
    // thumb: string;
}
