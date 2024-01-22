import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

const ICEBERGE_PHASES = [ 'Treacherous Tunnels', 'Brutal Bulwark', 'Bombing Run', 'The Mad Depths', 'Icewing\'s Lair', 'Hidden Depths', 'The Deep Lair', 'General'] as const;
type IcebergPhase = typeof ICEBERGE_PHASES[number];

export class IcebergStager implements IStager {
    readonly environment: string = 'Iceberg';

    readonly phaseToStage: Record<IcebergPhase, string> = {
        'Treacherous Tunnels': '0-300ft',
        'Brutal Bulwark':    '301-600ft',
        'Bombing Run':      '601-1600ft',
        'The Mad Depths':  '1601-1800ft',
        'Icewing\'s Lair':      '1800ft',
        'Hidden Depths':   '1801-2000ft',
        'The Deep Lair':        '2000ft',
        'General':            'Generals',
    };

    /**
     * Report the current distance / obstacle.
     * TODO: Stage / hunt details for first & second icewing hunting?
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestIceberg;

        if (!quest) {
            throw new Error('QuestIceberg is undefined');
        }

        if (!this.isIcebergPhase(quest.current_phase)) {
            throw new Error('Skipping unknown Iceberg stage');
        }

        message.stage = this.phaseToStage[quest.current_phase];
    }

    private isIcebergPhase(value: string): value is IcebergPhase {
        return ICEBERGE_PHASES.includes(value as IcebergPhase);
    }
}
