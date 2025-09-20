import {ClawShotCityDetailer} from '@scripts/modules/details/environments/clawShotCity';
import {User, JournalMarkup} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'jest-mock-extended';

describe('ClawShotCityDetailer', () => {
    const message = mock<IntakeMessage>();
    const userPost = mock<User>();
    const journal = mock<JournalMarkup>();
    let user: User;
    let detailer: ClawShotCityDetailer;

    beforeEach(() => {
        user = new UserBuilder()
            .withQuests({
                QuestRelicHunter: {
                    maps: []
                }
            })
            .build();
        detailer = new ClawShotCityDetailer();
    });

    it('should return undefined when no maps exist', () => {
        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return undefined when no wanted poster maps exist', () => {
        user.quests.QuestRelicHunter!.maps = [
            {name: 'Some Other Map', is_complete: null, num_found: 5, num_total: 10},
            {name: 'Another Map', is_complete: null, num_found: 3, num_total: 8},
        ];

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return undefined when wanted poster map is complete', () => {
        user.quests.QuestRelicHunter!.maps = [
            {name: 'Bounty Hunter Wanted Poster', is_complete: true, num_found: 5, num_total: 5},
        ];

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toBeUndefined();
    });

    it('should return poster type and boss status for incomplete wanted poster', () => {
        user.quests.QuestRelicHunter!.maps = [
            {name: 'Bounty Hunter Wanted Poster', is_complete: null, num_found: 1, num_total: 5},
        ];

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            poster_type: 'Bounty Hunter',
            at_boss: false,
        });
    });

    it('should detect boss when remaining is 1', () => {
        user.quests.QuestRelicHunter!.maps = [
            {name: 'Legendary Thief Wanted Poster', is_complete: null, num_found: 4, num_total: 5},
        ];

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            poster_type: 'Legendary Thief',
            at_boss: true,
        });
    });

    it('should handle different poster types', () => {
        user.quests.QuestRelicHunter!.maps = [
            {name: 'Master Burglar Wanted Poster', is_complete: null, num_found: 3, num_total: 5},
        ];

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            poster_type: 'Master Burglar',
            at_boss: false,
        });
    });

    it('should trim whitespace from poster type', () => {
        user.quests.QuestRelicHunter!.maps = [
            {name: '  Spaced Name  Wanted Poster', is_complete: null, num_found: 3, num_total: 5},
        ];

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            poster_type: 'Spaced Name',
            at_boss: false,
        });
    });
});
