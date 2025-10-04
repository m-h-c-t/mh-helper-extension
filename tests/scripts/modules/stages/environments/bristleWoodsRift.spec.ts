import type { IStager } from '@scripts/modules/stages/stages.types';
import type { User } from '@scripts/types/hg';
import type { QuestRiftBristleWoods } from '@scripts/types/hg/quests';
import type { IntakeMessage } from '@scripts/types/mhct';

import { BristleWoodsRiftStager } from '@scripts/modules/stages/environments/bristleWoodsRift';

describe('Bristle Woods Rift stages', () => {
    let stager: IStager;
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    const ChamberNames = [
        'Acolyte',
        'Ancient Lab',
        'Frozen Alcove',
        'Furnace Room',
        'Gearworks',
        'Guard Barracks',
        'Hidden Treasury',
        'Ingress',
        'Lucky Tower',
        'Pursuer Mousoleum',
        'Runic Laboratory',
        'Rift Acolyte Tower', // Entrance
        'Security',
        'Timewarp',
    ];

    beforeEach(() => {
        stager = new BristleWoodsRiftStager();
        message = {} as IntakeMessage;
        preUser = {quests: {
            QuestRiftBristleWoods: getDefaultQuest(),
        }} as User;
        postUser = {quests: {
            QuestRiftBristleWoods: getDefaultQuest(),
        }} as User;
    });

    it('should be for the Bristle Woods Rift environment', () => {
        expect(stager.environment).toBe('Bristle Woods Rift');
    });

    it('should throw when QuestRiftBristleWoods is undefined', () => {
        preUser.quests.QuestRiftBristleWoods = undefined;

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestRiftBristleWoods is undefined');
    });

    it.each(ChamberNames)('should set stage name to chamber name', (chamberName) => {
        preUser.quests.QuestRiftBristleWoods!.chamber_name = chamberName;

        stager.addStage(message, preUser, postUser, journal);

        const expected = chamberName === 'Rift Acolyte Tower' ? 'Entrance' : chamberName;
        expect(message.stage).toBe(expected);
    });

    function getDefaultQuest(): QuestRiftBristleWoods {
        return {
            chamber_name: '',
            items: {
                rift_hourglass_stat_item: {
                    quantity: 0,
                },
            },
            chamber_status: '',
            cleaver_status: '',
            status_effects: {
            },
            obelisk_percent: 0,
            acolyte_sand: 0
        };
    }
});
