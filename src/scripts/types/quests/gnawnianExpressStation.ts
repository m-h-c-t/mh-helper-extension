export type QuestTrainStation =
    OffTrain |
    SupplyPhase |
    BoardingPhase |
    JumpPhase;

interface BaseQuestTrainStation {
    on_train: boolean;
}

export interface OffTrain extends BaseQuestTrainStation {
    on_train: false
}

export interface BaseTrainPhase extends BaseQuestTrainStation {
    on_train: true
    current_phase: TrainPhaseType
}

export interface SupplyPhase extends BaseTrainPhase {
    current_phase: 'supplies'
    minigame: {
        supply_hoarder_turns: number
    }
}

export interface BoardingPhase extends BaseTrainPhase {
    current_phase: 'boarding'
    minigame: {
        trouble_area: TroubleArea
    }
}

export type TroubleArea = 'roof' | 'door' | 'rails';

export interface JumpPhase extends BaseTrainPhase {
    current_phase: 'bridge_jump'
}

export type TrainPhaseType = 'supplies' | 'boarding' | 'bridge_jump';
