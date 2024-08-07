import {GnawnianExpressStationStager} from "@scripts/modules/stages/environments/gnawnianExpressStation";
import {IStager} from "@scripts/modules/stages/stages.types";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {BoardingPhase, JumpPhase, OffTrain, QuestTrainStation, SupplyPhase, TroubleArea} from "@scripts/types/hg/quests";

describe('Gnawnian Express Station stages', () => {
    let stager: IStager;
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        stager = new GnawnianExpressStationStager();
        message = {} as IntakeMessage;
        preUser = {quests: {
            QuestTrainStation: getDefaultQuest(),
        }} as User;
        postUser = {quests: {
            QuestTrainStation: getDefaultQuest(),
        }} as User;
    });

    it('should be for the Gnawnian Express Station environment', () => {
        expect(stager.environment).toBe('Gnawnian Express Station');
    });

    it('it should throw when quest is undefined', () => {
        preUser.quests.QuestTrainStation = undefined;

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestTrainStation is undefined');

        preUser.quests.QuestTrainStation = getDefaultQuest();
        postUser.quests.QuestTrainStation = undefined;

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestTrainStation is undefined');
    });

    it('should reject when pre and post on_train differ', () => {
        message.location = {id: 0, name: "GES"}; // legacy rejects by setting location to null
        preUser.quests.QuestTrainStation = createJumpPhaseAttributes();
        postUser.quests.QuestTrainStation = createOffTrainAttributes();

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping hunt due to server-side train stage change');
    });

    it('should reject when pre and post train phase differ', () => {
        preUser.quests.QuestTrainStation = createSuppyPhaseAttributes();
        postUser.quests.QuestTrainStation = createBoardingPhaseAttributes();

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping hunt due to server-side train stage change');
    });

    it('should set stage to Station when not on train', () => {
        preUser.quests.QuestTrainStation = createOffTrainAttributes();
        postUser.quests.QuestTrainStation = createOffTrainAttributes();

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Station');
    });

    describe('Supply Depot', () => {

        it('should be Rush when more than zero supply hoarder turns', () => {
            preUser.quests.QuestTrainStation = createSuppyPhaseAttributes(1);
            postUser.quests.QuestTrainStation = createSuppyPhaseAttributes(1);

            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('1. Supply Depot - Rush');
        });

        it('should be No Rush when zero supply hoarder turns', () => {
            preUser.quests.QuestTrainStation = createSuppyPhaseAttributes(0);
            postUser.quests.QuestTrainStation = createSuppyPhaseAttributes(0);

            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('1. Supply Depot - No Rush');
        });

        it('should be No Rush + SS Charm when zero supply hoarder turns with Supply Schedule Charm equipped', () => {
            preUser.trinket_name = "Supply Schedule Charm";
            preUser.quests.QuestTrainStation = createSuppyPhaseAttributes(0);
            postUser.quests.QuestTrainStation = createSuppyPhaseAttributes(0);

            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe('1. Supply Depot - No Rush + SS Charm');
        });
    });

    describe('Raider River', () => {
        type DefendingCharm = 'Door Guard' | 'Greasy Glob' | 'Roof Rack';
        const charmToId: Record<DefendingCharm, number> = {
            'Door Guard': 1210,
            'Greasy Glob': 1211,
            'Roof Rack': 1212,
        };

        it('should reject if pre and post trouble area differ', () => {
            preUser.quests.QuestTrainStation = createBoardingPhaseAttributes('door');
            postUser.quests.QuestTrainStation = createBoardingPhaseAttributes('rails');

            expect(() => stager.addStage(message, preUser, postUser, journal))
                .toThrow('Skipping hunt during server-side trouble area change');
        });

        it.each<{troubleArea: TroubleArea, charm: DefendingCharm}>([
            {troubleArea: 'door', charm: 'Door Guard'},
            {troubleArea: 'rails', charm: 'Greasy Glob'},
            {troubleArea: 'roof', charm: 'Roof Rack'},
        ])('should append Defending Target when guarding appropriate area', ({troubleArea, charm}) => {
            message.charm = {
                id: charmToId[charm],
                name: charm,
            };
            preUser.quests.QuestTrainStation = createBoardingPhaseAttributes(troubleArea);
            postUser.quests.QuestTrainStation = createBoardingPhaseAttributes(troubleArea);

            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe(`2. Raider River - Defending Target`);
        });

        it.each<{troubleArea: TroubleArea, charm: DefendingCharm}>([
            {troubleArea: 'door', charm: 'Roof Rack'},
            {troubleArea: 'rails', charm: 'Roof Rack'},
            {troubleArea: 'roof', charm: 'Greasy Glob'},
        ])('should append Defending Other when guarding other area', ({troubleArea, charm}) => {
            message.charm = {
                id: charmToId[charm],
                name: charm,
            };
            preUser.quests.QuestTrainStation = createBoardingPhaseAttributes(troubleArea);
            postUser.quests.QuestTrainStation = createBoardingPhaseAttributes(troubleArea);

            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe(`2. Raider River - Defending Other`);
        });

        it('should append Not Defending with no area specific charm', () => {
            message.charm = {
                id: 42,
                name: "The Answer",
            };
            preUser.quests.QuestTrainStation = createBoardingPhaseAttributes('door');
            postUser.quests.QuestTrainStation = createBoardingPhaseAttributes('door');

            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe(`2. Raider River - Not Defending`);
        });
    });

    describe('Daredevil Canyon', () => {

        it.each<{charm: string, expected: string}>([
            {charm: 'Magmatic Crystal Charm', expected: '- Magmatic Crystal'},
            {charm: 'Black Powder Charm', expected: '- Black Powder'},
            {charm: 'Dusty Coal Charm', expected: '- Dusty Coal'},
            {charm: 'No Charm', expected: '- No Fuelers'},
        ])('should append $expected when charm is $charm', ({charm, expected}) => {
            preUser.trinket_name = charm;
            preUser.quests.QuestTrainStation = createJumpPhaseAttributes();
            postUser.quests.QuestTrainStation = createJumpPhaseAttributes();

            stager.addStage(message, preUser, postUser, journal);

            expect(message.stage).toBe(`3. Daredevil Canyon ${expected}`);
        });
    });
});

export function getDefaultQuest(): QuestTrainStation {
    return createOffTrainAttributes();
}

export function createOffTrainAttributes(): OffTrain {
    return {
        on_train: false,
    };
}

export function createSuppyPhaseAttributes(supplyHoarderTurns = 5): SupplyPhase {
    return {
        on_train: true,
        current_phase: 'supplies',
        minigame: {
            supply_hoarder_turns: supplyHoarderTurns,
        },
    };
}

export function createBoardingPhaseAttributes(troubleArea: TroubleArea = "roof"): BoardingPhase {
    return {
        on_train: true,
        current_phase: 'boarding',
        minigame: {
            trouble_area: troubleArea,
        },
    };
}

export function createJumpPhaseAttributes(): JumpPhase {
    return {
        on_train: true,
        current_phase: 'bridge_jump',
    };
}
