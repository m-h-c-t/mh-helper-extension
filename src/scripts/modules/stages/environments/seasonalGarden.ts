import type {SeasonalGardenViewingAttributes, User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type IStager} from '../stages.types';

const ALL_SEASONS_SHORT = ['sg', 'sr', 'fl', 'wr'] as const;
type SeasonShort = typeof ALL_SEASONS_SHORT[number];

export class SeasonalGardenStager implements IStager {
    readonly environment: string = 'Seasonal Garden';

    readonly seasonToStage: Record<SeasonShort, string> = {
        'sg': 'Spring',
        'sr': 'Summer',
        'fl': 'Fall',
        'wr': 'Winter',
    };

    /**
     * Read the viewing attributes to determine the season. Reject hunts where the season changed.
     */
    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        this.isSeasonalGarden(userPre);
        this.isSeasonalGarden(userPost);

        const season = userPre.viewing_atts.season;
        const final_season = userPost.viewing_atts.season;

        if (!season || !final_season || season !== final_season) {
            throw new Error('Skipping hunt due to server side season change');
        }

        if (!this.isGardenSeason(season)) {
            throw new Error('Unexpected garden season');
        }

        message.stage = this.seasonToStage[season];

    }

    private isSeasonalGarden(user: User): asserts user is User & { viewing_atts: SeasonalGardenViewingAttributes } {
        if (!('season' in user.viewing_atts) || user.viewing_atts.season == null) {
            throw new Error('Seasonal Garden season not found in user viewing_attributes');
        }
    }

    private isGardenSeason(value: string): value is SeasonShort {
        return ALL_SEASONS_SHORT.includes(value as SeasonShort);
    }
}
