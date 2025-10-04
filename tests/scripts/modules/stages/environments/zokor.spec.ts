import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { ZokorStager } from '@scripts/modules/stages/environments/zokor';

describe('Zokor stages', () => {
    const DISTRICTS = [
        // Fealty
        'Outer Fealty Shrine',
        'Inner Fealty Temple',
        'Templar\'s Sanctum',

        // Scholar
        'Neophyte Scholar Study',
        'Master Scholar Auditorium',
        'Dark Library',

        // Tech
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

    it('should be for the "Zokor" environment', () => {
        const stager = new ZokorStager();
        expect(stager.environment).toBe('Zokor');
    });

    it.each(DISTRICTS.map((v, i) => [v, ZOKOR_STAGES[i]]))('wip: %p when the district is $district', (district, expected) => {
        const stager = new ZokorStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestAncientCity: {
            district_name: district,
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should throw for unknown district', () => {
        const stager = new ZokorStager();
        const message = {location: {}} as IntakeMessage;
        const preUser = {quests: {QuestAncientCity: {
            district_name: 'District 9',
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping unknown Zokor district');
    });

    it.each([undefined, null])('should throw when QuestAncientCity is %p', (state) => {
        const stager = new ZokorStager();
        const message = {location: {}} as IntakeMessage;
        const preUser = {quests: {QuestAncientCity: state}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestAncientCity is undefined');
    });
});
