import { SpringEggHuntDetailer, type SpringEggHuntDetails } from '@scripts/modules/details/global/springEggHunt'
import { type User } from '@scripts/types/hg';
import { type QuestSpringHunt } from '@scripts/types/quests';

describe('SpringEggHuntDetailer', () => {
    describe('getDetails', () => {
        it('returns undefined when quest is undefined', () => {
            const detailer = new SpringEggHuntDetailer()
            const user: User = {
                quests: {}
            } as User;

            expect(detailer.addDetails(null, user, user, null!)).toBe(undefined);
        })

        it('adds expected details when SEH quest is active', () => {
            const detailer = new SpringEggHuntDetailer();

            const preQuest: QuestSpringHunt = getDefaultQuest();
            preQuest.charge_quantity = "10";
            const postQuest: QuestSpringHunt = getDefaultQuest();
            postQuest.charge_quantity = "11";

            const preUser: User = {
                quests: {
                    QuestSpringHunt: preQuest
                }
            } as User;

            const postUser: User = {
                quests: {
                    QuestSpringHunt: postQuest
                }
            } as User;

            const expected: SpringEggHuntDetails = {
                is_egg_hunt: true,
                egg_charge_pre: 10,
                egg_charge_post: 11,
                can_double_eggs: true
            }

            expect(detailer.addDetails(null, preUser, postUser, null!)).toStrictEqual(expected);
        });
    })

    function getDefaultQuest(): QuestSpringHunt {
        return {
            charge_doubler: "active",
            charge_quantity: "0"
        }
    }
})
