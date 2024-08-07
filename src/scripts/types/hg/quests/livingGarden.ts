export type QuestLivingGarden = LivingGardenState | TwistedGardenState

interface LivingGardenState {
    is_normal: true
    minigame: {
        bucket_state: PourStatus
    }
}

interface TwistedGardenState {
    is_normal: false
    minigame: {
         vials_state: PourStatus
    }
}

type PourStatus = 'filling' | 'dumped';
