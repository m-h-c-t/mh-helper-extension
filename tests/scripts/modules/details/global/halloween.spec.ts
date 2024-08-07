import {HalloweenDetailer, type HalloweenDetails} from '@scripts/modules/details/global/halloween';
import {type User} from '@scripts/types/hg';
import {type IntakeMessage} from '@scripts/types/mhct';
import {type QuestHalloweenBoilingCauldron} from '@scripts/types/hg/quests';

describe('HalloweenDetailer', () => {
    describe('getDetails', () => {
        it('returns undefined when quest is undefined', () => {
            const detailer = new HalloweenDetailer();
            const message = {} as IntakeMessage;
            const user: User = {
                quests: {},
            } as User;

            expect(detailer.addDetails(message, user, user, null!)).toBe(undefined);
        });

        it('adds expected details when Halloween quest is active and reward track is complete', () => {
            const detailer = new HalloweenDetailer();
            const message = {} as IntakeMessage;
            const postUser = {} as User;
            const preQuest: QuestHalloweenBoilingCauldron = getDefaultQuest();
            preQuest.reward_track.is_complete = true;

            const preUser: User = {
                quests: {
                    QuestHalloweenBoilingCauldron: preQuest,
                },
            } as User;

            const expected: HalloweenDetails = {
                has_baba_gaga_boon: true,
            };

            expect(detailer.addDetails(message, preUser, postUser, null!)).toStrictEqual(expected);
        });

        it('does not add details when Halloween quest is active and reward track is incomplete', () => {
            const detailer = new HalloweenDetailer();
            const message = {} as IntakeMessage;
            const postUser = {} as User;
            const preQuest: QuestHalloweenBoilingCauldron = getDefaultQuest();

            const preUser: User = {
                quests: {
                    QuestHalloweenBoilingCauldron: preQuest,
                },
            } as User;

            expect(detailer.addDetails(message, preUser, postUser, null!)).toStrictEqual(undefined);
        });
    });

    function getDefaultQuest(): QuestHalloweenBoilingCauldron {
        return {
            reward_track: {
                is_complete: null,
            },
        };
    }
});
