import {LunarNewYearDetailer} from '@scripts/modules/details/global/lunarNewYear';
import {JournalMarkup, QuestLunarNewYearLantern, User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'jest-mock-extended';

describe('LunarNewYearDetailer', () => {
    const message = mock<IntakeMessage>();
    const journal = mock<JournalMarkup>();

    let stager: LunarNewYearDetailer;
    let preUser: User & { quests: { QuestLunarNewYearLantern: QuestLunarNewYearLantern } };
    let postUser: User & { quests: { QuestLunarNewYearLantern: QuestLunarNewYearLantern } };
    beforeEach(() => {
        stager = new LunarNewYearDetailer();
        preUser = new UserBuilder()
            .withQuests({
                QuestLunarNewYearLantern: {
                    lantern_status: 'lantern',
                    is_lantern_active: true,
                    lantern_height: 142,
                }
            }).build() as User & { quests: { QuestLunarNewYearLantern: QuestLunarNewYearLantern } };
        postUser = new UserBuilder()
            .withQuests({
                QuestLunarNewYearLantern: {
                    lantern_status: 'lantern',
                    is_lantern_active: true,
                    lantern_height: 255,
                }
            }).build() as User & { quests: { QuestLunarNewYearLantern: QuestLunarNewYearLantern } };
    });

    describe('getDetails', () => {
        it('returns undefined when quest is undefined', () => {
            // @ts-expect-error - testing nullish input
            preUser.quests.QuestLunarNewYearLantern = undefined;
            // @ts-expect-error - testing nullish input
            postUser.quests.QuestLunarNewYearLantern = undefined;

            expect(stager.addDetails(message, preUser, postUser, journal)).toBe(undefined);
        });

        it('calculates luck using pre hunt quest', () => {
            preUser.quests.QuestLunarNewYearLantern.lantern_height = 142;
            postUser.quests.QuestLunarNewYearLantern.lantern_height = 255;

            const expected = {
                is_lny_hunt: true,
                lny_luck: 14
            };

            expect(stager.addDetails(message, preUser, postUser, journal)).toStrictEqual(expected);
        });

        it('sets luck to 0 when latern is not active', () => {
            preUser.quests.QuestLunarNewYearLantern.lantern_status = '';
            preUser.quests.QuestLunarNewYearLantern.is_lantern_active = false;
            preUser.quests.QuestLunarNewYearLantern.lantern_height = 144;

            const expected = {
                is_lny_hunt: true,
                lny_luck: 0
            };

            expect(stager.addDetails(message, preUser, postUser, journal)).toStrictEqual(expected);
        });

        it('sets max luck to 50', () => {
            preUser.quests.QuestLunarNewYearLantern.lantern_height = 1000;

            const expected = {
                is_lny_hunt: true,
                lny_luck: 50
            };
            expect(stager.addDetails(message, preUser, postUser, journal)).toStrictEqual(expected);
        });
    });
});
