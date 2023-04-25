import {addZokorStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Zokor stages', () => {
    const DISTRICTS = [
        // Fealty
        'Outer Fealty Shrine',
        'Inner Fealty Temple',
        'Templar\'s Sanctum',

        //Scholar
        'Neophyte Scholar Study',
        'Master Scholar Auditorium',
        'Dark Library',

        //Tech
        'Tech Foundry Outskirts',
        'Tech Research Center',
        'Manaforge',

        // Treasury
        'Treasure Room',
        'Treasure Vault',

        // Farming
        'Farming Garden',
        'Overgrown Farmhouse',

        'Lair of the Minotaur',
    ];

    const ZOKOR_STAGES = [
        'Fealty 15+',
        'Fealty 50+',
        'Fealty 80+',

        'Scholar 15+',
        'Scholar 50+',
        'Scholar 80+',

        'Tech 15+',
        'Tech 50+',
        'Tech 80+',

        'Treasure 15+',
        'Treasure 50+',

        'Farming 0+',
        'Farming 50+',

        'Lair - Each 30+',
    ];

    it.each(DISTRICTS.map((v, i) => [v, ZOKOR_STAGES[i]]))('', (district, expected) => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestAncientCity: {
            district_name: district,
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        addZokorStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should set location to null for unknown district', () => {
        const message = {location: {}} as IntakeMessage;
        const preUser = {quests: {QuestAncientCity: {
            district_name: 'District 9',
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(message.location).not.toBeNull();

        addZokorStage(message, preUser, postUser, journal);

        expect(message.location).toBeNull();
    });
});
