import type {SeasonalGardenViewingAttributes, ViewingAttributes, User} from '@scripts/types/hg';
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
        const pre_viewing_atts = userPre.viewing_atts;
        const post_viewing_atts = userPost.viewing_atts;
        if (!this.hasGardenAttributes(pre_viewing_atts) || !this.hasGardenAttributes(post_viewing_atts)) {
            throw new Error('Seasonal Garden season not found in user viewing_attributes');
        }

        const season = pre_viewing_atts.season;
        const final_season = post_viewing_atts.season;

        if (!season || !final_season || season !== final_season) {
            throw new Error('Skipping hunt due to server side season change');
        }

        if (!this.isGardenSeason(season)) {
            throw new Error('Unexpected garden season');
        }

        message.stage = this.seasonToStage[season];

    }

    private hasGardenAttributes(object: ViewingAttributes): object is SeasonalGardenViewingAttributes {
        return (object as SeasonalGardenViewingAttributes).season != null;
    }

    private isGardenSeason(value: string): value is SeasonShort {
        return ALL_SEASONS_SHORT.includes(value as SeasonShort);
    }
}
