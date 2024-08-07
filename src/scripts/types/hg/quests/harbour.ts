export interface QuestHarbour {
    // There is probably one more state here for when can_claim is true
    status: 'canBeginSearch' | 'searchStarted';
    can_claim: boolean;
}
