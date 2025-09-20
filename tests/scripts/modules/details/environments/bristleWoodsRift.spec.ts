import {BristleWoodsRiftDetailer} from '@scripts/modules/details/environments/bristleWoodsRift';
import {JournalMarkup, User} from '@scripts/types/hg';
import {IntakeMessage} from '@scripts/types/mhct';
import {UserBuilder} from '@tests/utility/builders';
import {mock} from 'jest-mock-extended';

describe('BristleWoodsRiftDetailer', () => {
    const message = mock<IntakeMessage>();
    const userPost = mock<User>();
    const journal = mock<JournalMarkup>();
    let user: User;
    let detailer: BristleWoodsRiftDetailer;

    beforeEach(() => {
        user = new UserBuilder()
            .withQuests({
                QuestRiftBristleWoods: {
                    chamber_name: '',
                    items: {
                        rift_hourglass_stat_item: {quantity: 0}
                    },
                    chamber_status: '',
                    cleaver_status: '',
                    status_effects: {},
                    obelisk_percent: 0,
                    acolyte_sand: 0
                }
            })
            .build();
        detailer = new BristleWoodsRiftDetailer();
    });

    it('should track hourglass status when quantity >= 1', () => {
        user.quests.QuestRiftBristleWoods!.items.rift_hourglass_stat_item.quantity = 2;

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual(expect.objectContaining({
            has_hourglass: true,
        }));
    });

    it('should track hourglass status when quantity < 1', () => {
        user.quests.QuestRiftBristleWoods!.items.rift_hourglass_stat_item.quantity = 0;

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual(expect.objectContaining({
            has_hourglass: false,
        }));
    });

    it('should track chamber and cleaver status', () => {
        user.quests.QuestRiftBristleWoods!.chamber_status = 'active';
        user.quests.QuestRiftBristleWoods!.cleaver_status = 'ready';

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual(expect.objectContaining({
            chamber_status: 'active',
            cleaver_status: 'ready',
        }));
    });

    it('should track status effects as booleans', () => {
        user.quests.QuestRiftBristleWoods!.status_effects = {
            effect1: 'active',
            effect2: 'removed',
            effect3: '',
        };

        const result = detailer.addDetails(message, user, userPost, journal);

        expect(result).toEqual(expect.objectContaining({
            effect_effect1: true,
            effect_effect2: false,
            effect_effect3: false,
        }));
    });

    describe('when in Acolyte chamber', () => {
        beforeEach(() => {
            user.quests.QuestRiftBristleWoods!.chamber_name = 'Acolyte';
        });

        it('should track obelisk charged status when percent is 100', () => {
            user.quests.QuestRiftBristleWoods!.obelisk_percent = 100;
            user.quests.QuestRiftBristleWoods!.acolyte_sand = 10;

            const result = detailer.addDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                obelisk_charged: true,
                acolyte_sand_drained: false,
            }));
        });

        it('should track acolyte sand drained when obelisk charged and sand is 0', () => {
            user.quests.QuestRiftBristleWoods!.obelisk_percent = 100;
            user.quests.QuestRiftBristleWoods!.acolyte_sand = 0;

            const result = detailer.addDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                obelisk_charged: true,
                acolyte_sand_drained: true,
            }));
        });

        it('should not track acolyte sand drained when obelisk not charged', () => {
            user.quests.QuestRiftBristleWoods!.obelisk_percent = 50;
            user.quests.QuestRiftBristleWoods!.acolyte_sand = 0;

            const result = detailer.addDetails(message, user, userPost, journal);

            expect(result).toEqual(expect.objectContaining({
                obelisk_charged: false,
                acolyte_sand_drained: false,
            }));
        });
    });

    describe('when not in Acolyte chamber', () => {
        it('should not include acolyte-specific properties', () => {
            user.quests.QuestRiftBristleWoods!.chamber_name = 'Other';

            const result = detailer.addDetails(message, user, userPost, journal);

            expect(result).not.toHaveProperty('obelisk_charged');
            expect(result).not.toHaveProperty('acolyte_sand_drained');
        });
    });
});
