import { type User } from '@scripts/types/hg';
import { type IntakeMessage } from '@scripts/types/mhct';

import { type IStager } from '../stages.types';

const DISTRICTS = [
    // Level 1
    'Garden',
    'Study',
    'Shrine',
    'Outskirts',
    'Room',
    // Level 2
    'Temple',
    'Auditorium',
    'Farmhouse',
    'Center',
    'Vault',
    // Level 3
    'Library',
    'Manaforge',
    'Sanctum',
    // Mino
    'Minotaur',
] as const;
type District = typeof DISTRICTS[number];

export class ZokorStager implements IStager {
    readonly environment: string = 'Zokor';

    readonly partialDistrictToStage: Record<District, string> = {
        Garden: 'Farming 0+',
        Study: 'Scholar 15+',
        Shrine: 'Fealty 15+',
        Outskirts: 'Tech 15+',
        Room: 'Treasure 15+',
        Minotaur: 'Lair - Each 30+',
        Temple: 'Fealty 50+',
        Auditorium: 'Scholar 50+',
        Farmhouse: 'Farming 50+',
        Center: 'Tech 50+',
        Vault: 'Treasure 50+',
        Library: 'Scholar 80+',
        Manaforge: 'Tech 80+',
        Sanctum: 'Fealty 80+',
    };

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestAncientCity;

        if (!quest) {
            throw new Error('QuestAncientCity is undefined');
        }

        if (!this.isDistrict(quest.district_name)) {
            throw new Error('Skipping unknown Zokor district');
        }

        const zokor_district = quest.district_name;
        message.stage = this.getStage(zokor_district);
    }

    private isDistrict(value: unknown): boolean {
        return typeof value === 'string' && DISTRICTS.filter(key => value.search(new RegExp(key, 'i')) !== -1).length > 0;
    }

    private getStage(value: string) {
        const district = (Object.keys(this.partialDistrictToStage) as District[]).find(key => value.search(new RegExp(key, 'i')) !== -1);

        if (!district) {
            throw new Error(`${value} is not recogized as a known Zokor district`);
        }

        return this.partialDistrictToStage[district];
    }
}
