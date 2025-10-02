import {HarbourDetailer} from '@scripts/modules/details/environments/harbour';
import {User, JournalMarkup} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'vitest-mock-extended';

describe('HarbourDetailer', () => {
    const message = mock<IntakeMessage>();
    const userPost = mock<User>();
    const journal = mock<JournalMarkup>();
    let user: User;
    let detailer: HarbourDetailer;

    beforeEach(() => {
        user = new UserBuilder()
            .withQuests({
                QuestHarbour: {
                    status: 'noShip',
                    can_claim: false,
                    crew: []
                }
            })
            .build();
        detailer = new HarbourDetailer();
    });

    describe('bounty status', () => {
        it('should be on bounty when status is searchStarted', () => {
            user.quests.QuestHarbour!.status = 'searchStarted';

            const result = detailer.addDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                on_bounty: true,
            }));
        });

        it('should not be on bounty when status is not searchStarted', () => {
            user.quests.QuestHarbour!.status = 'noShip';

            const result = detailer.addDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                on_bounty: false,
            }));
        });
    });

    describe('crew status tracking', () => {
        it('should track caught crew members as true', () => {
            user.quests.QuestHarbour!.crew = [
                {type: 'captain', status: 'caught'},
                {type: 'first_mate', status: 'caught'},
            ];

            const result = detailer.addDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                has_caught_captain: true,
                has_caught_first_mate: true,
            }));
        });

        it('should track uncaught crew members as false', () => {
            user.quests.QuestHarbour!.crew = [
                {type: 'captain', status: 'uncaught'},
                {type: 'first_mate', status: 'uncaught'},
            ];

            const result = detailer.addDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                has_caught_captain: false,
                has_caught_first_mate: false,
            }));
        });

        it('should handle mixed crew statuses', () => {
            user.quests.QuestHarbour!.crew = [
                {type: 'captain', status: 'caught'},
                {type: 'first_mate', status: 'uncaught'},
                {type: 'quartermaster', status: 'caught'},
                {type: 'cook', status: 'uncaught'},
            ];

            const result = detailer.addDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                has_caught_captain: true,
                has_caught_first_mate: false,
                has_caught_quartermaster: true,
                has_caught_cook: false,
            }));
        });

        it('should handle empty crew array', () => {
            user.quests.QuestHarbour!.crew = [];

            const result = detailer.addDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                on_bounty: false,
            }));
            // Should not have any crew-specific properties
            expect(Object.keys(result ?? {}).filter(key => key.startsWith('has_caught_'))).toHaveLength(0);
        });
    });

    it('should combine bounty and crew status', () => {
        user.quests.QuestHarbour!.status = 'searchStarted';
        user.quests.QuestHarbour!.crew = [
            {type: 'navigator', status: 'caught'},
            {type: 'lookout', status: 'uncaught'},
        ];

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual({
            on_bounty: true,
            has_caught_navigator: true,
            has_caught_lookout: false,
        });
    });
});
