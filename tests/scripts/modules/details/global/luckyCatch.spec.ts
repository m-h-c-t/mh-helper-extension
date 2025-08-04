import {calcLuckyCatchHuntDetails} from '@scripts/modules/details/legacy';
import {JournalMarkup} from '@scripts/types/hg';
import {HgResponseBuilder, IntakeMessageBuilder, UserBuilder} from '@tests/utility/builders';

describe('calcLuckyCatchHuntDetails', () => {
    const hgResponseBuilder = new HgResponseBuilder();
    const messageBuilder = new IntakeMessageBuilder();
    const userBuilder = new UserBuilder();

    const defaultJournalMarkupEntry: JournalMarkup = {
        render_data: {
            css_class: 'some-class luckycatchsuccess another-class',
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

        return {message, preUser, postUser};
    };

    describe('when mouse is not caught', () => {
        it('should return undefined', () => {
            const {message, preUser, postUser} = setupHuntTest();
            message.caught = 0;

            const result = calcLuckyCatchHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

            expect(result).toBeUndefined();
        });
    });

    describe('when mouse is caught', () => {

        it('should return is_lucky_catch as true when css_class includes luckycatchsuccess', () => {
            defaultJournalMarkupEntry.render_data.css_class = 'some-class luckycatchsuccess another-class';
            const {message, preUser, postUser} = setupHuntTest();

            const result = calcLuckyCatchHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

            expect(result).toEqual({
                is_lucky_catch: true,
            });
        });

        it('should return is_lucky_catch as false when css_class does not include luckycatchsuccess', () => {
            defaultJournalMarkupEntry.render_data.css_class = 'some-class other-success another-class';
            const {message, preUser, postUser} = setupHuntTest();

            const result = calcLuckyCatchHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

            expect(result).toEqual({
                is_lucky_catch: false,
            });
        });

        it('should return is_lucky_catch as false when css_class is empty', () => {
            defaultJournalMarkupEntry.render_data.css_class = '';
            const {message, preUser, postUser} = setupHuntTest();

            const result = calcLuckyCatchHuntDetails(message, preUser, postUser, defaultJournalMarkupEntry);

            expect(result).toEqual({
                is_lucky_catch: false,
            });
        });
    });
});
