import {DraconicDepthsStager} from "@scripts/modules/stages/environments/draconicDepths";
import {IStager} from "@scripts/modules/stages/stages.types";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import type {CavernType, QuestDraconicDepths} from "@scripts/types/hg/quests/draconicDepths";

describe('Draconic Depths stages', () => {
    let stager: IStager;
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        stager = new DraconicDepthsStager();
        message = {} as IntakeMessage;
        preUser = {quests: {
            QuestDraconicDepths: getDefaultQuest(),
        }} as User;
        postUser = {} as User;
    });

    it('should be for the Draconic Depths environment', () => {
        expect(stager.environment).toBe('Draconic Depths');
    });

    it('it should throw when quest is undefined', () => {
        preUser.quests.QuestDraconicDepths = undefined;

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestDraconicDepths is undefined');
    });

    it('should set stage to Crucible Forge when not in cavern', () => {
        preUser.quests.QuestDraconicDepths!.in_cavern = false;

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Crucible Forge');
    });

    it.each<{type: CavernType | 'invalid_cavern', category: 'fire' | 'ice' | 'poison' | 'elemental', currentTier: number, expected: string}>([
        {type: 'flame_cavern', category: 'fire', currentTier: 1, expected: 'Cavern - 1x Fire 0-99'},
        {type: 'ice_lair', category: 'ice', currentTier: 2, expected: 'Cavern - 1x Ice 100-249'},
        {type: 'toxic_tunnels', category: 'poison', currentTier: 3, expected: 'Cavern - 1x Poison 250-749'},
        {type: 'double_ice_lair', category: 'ice', currentTier: 4, expected: 'Cavern - 2x Ice 750+'},
        {type: 'triple_flame_cavern', category: 'fire', currentTier: 1, expected: 'Cavern - 3x Fire 0-99'},
        {type: 'elemental_dragon_den', category: 'elemental', currentTier: 1, expected: 'Cavern - Elemental 0-99'},
        {type: 'elemental_dragon_den', category: 'elemental', currentTier: 4, expected: 'Cavern - Elemental 750+'},
        {type: 'invalid_cavern', category: 'poison', currentTier: 4, expected: 'Cavern - ?x Poison 750+'},
    ])('should set stage to "$expected" when in looting a tier $currentTier $type', ({type, category, currentTier, expected}) => {
        preUser.quests.QuestDraconicDepths = {
            in_cavern: true,
            cavern: {
                // @ts-expect-error - testing invalid cavern type
                type,
                category,
                loot_tier: {
                    current_tier: currentTier,
                    tier_data: [
                        {threshold: 0},
                        {threshold: 100},
                        {threshold: 250},
                        {threshold: 750},
                    ],
                },
            },
        };

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });
});

export function getDefaultQuest(): QuestDraconicDepths {
    return {
        in_cavern: true,
        cavern: {
            type: 'flame_cavern',
            category: 'fire',
            loot_tier: {
                current_tier: 1,
                tier_data: [
                    {threshold: 0},
                    {threshold: 100},
                    {threshold: 250},
                    {threshold: 750},
                ],
            },
        },
    };
}
