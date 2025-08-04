import {calcPillageHuntDetails} from '@scripts/modules/details/legacy';
import {JournalMarkup} from '@scripts/types/hg';
import {HgResponseBuilder, IntakeMessageBuilder, UserBuilder} from '@tests/utility/builders';

describe('calcPillageHuntDetails', () => {
    const hgResponseBuilder = new HgResponseBuilder();
    const messageBuilder = new IntakeMessageBuilder();
    const userBuilder = new UserBuilder();

    const defaultJournalMarkupEntry: JournalMarkup = {
        render_data: {
            css_class: 'some-class another-class',
            entry_id: 0,
            mouse_type: '',
            entry_date: '',
            environment: '',
            entry_timestamp: 0,
            text: ''
        },
    };

    const setupHuntTest = () => {
        const preUser = userBuilder.build();
        const postUser = userBuilder.build();
        const response = hgResponseBuilder
            .withUser(postUser)
            .withJournalMarkup([defaultJournalMarkupEntry])
            .build();
        const message = messageBuilder.build(response);
        message.attracted = 1;
        message.caught = 0;

        return {message, preUser, postUser};
    };

    describe('when mouse is not attracted', () => {
        it('should return undefined', () => {
            const {message, preUser, postUser} = setupHuntTest();
            message.attracted = 0;

            const result = calcPillageHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

            expect(result).toBeUndefined();
        });
    });

    describe('when mouse is attracted but caught', () => {
        it('should return undefined', () => {
            const {message, preUser, postUser} = setupHuntTest();
            message.caught = 1;

            const result = calcPillageHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

            expect(result).toBeUndefined();
        });
    });

    describe('when mouse is attracted but not caught', () => {
        it('should return undefined when css_class does not include catchfailuredamage', () => {
            defaultJournalMarkupEntry.render_data.css_class = 'some-other-class';
            const {message, preUser, postUser} = setupHuntTest();

            const result = calcPillageHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

            expect(result).toBeUndefined();
        });

        describe('when css_class includes catchfailuredamage', () => {
            beforeEach(() => {
                defaultJournalMarkupEntry.render_data.css_class = 'some-class catchfailuredamage another-class';
            });

            it('should return pillage data for gold', () => {
                defaultJournalMarkupEntry.render_data.text = 'Additionally, the mouse stole 1,500 gold from you!';
                const {message, preUser, postUser} = setupHuntTest();

                const result = calcPillageHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

                expect(result).toEqual({
                    pillage_amount: 1500,
                    pillage_type: 'gold',
                });
            });

            it('should return pillage data for bait', () => {
                defaultJournalMarkupEntry.render_data.text = 'Additionally, the mouse took 10 bait from your trap!';
                const {message, preUser, postUser} = setupHuntTest();

                const result = calcPillageHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

                expect(result).toEqual({
                    pillage_amount: 10,
                    pillage_type: 'bait',
                });
            });

            it('should return pillage data for points', () => {
                defaultJournalMarkupEntry.render_data.text = 'Additionally, you lost 2,000 points in the encounter!';
                const {message, preUser, postUser} = setupHuntTest();

                const result = calcPillageHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

                expect(result).toEqual({
                    pillage_amount: 2000,
                    pillage_type: 'points',
                });
            });

            it('should handle large numbers with commas', () => {
                defaultJournalMarkupEntry.render_data.text = 'Additionally, the mouse stole 1,234,567 gold from you!';
                const {message, preUser, postUser} = setupHuntTest();

                const result = calcPillageHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

                expect(result).toEqual({
                    pillage_amount: 1234567,
                    pillage_type: 'gold',
                });
            });

            it('should return undefined when text does not match expected pattern', () => {
                defaultJournalMarkupEntry.render_data.text = 'Some other failure message';
                const {message, preUser, postUser} = setupHuntTest();

                const result = calcPillageHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

                expect(result).toBeUndefined();
            });

            it('should return undefined when match length is incorrect', () => {
                defaultJournalMarkupEntry.render_data.text = 'Additionally, something happened';
                const {message, preUser, postUser} = setupHuntTest();

                const result = calcPillageHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

                expect(result).toBeUndefined();
            });
        });
    });
});
