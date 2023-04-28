
import {addTableOfContentsStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Table of Contents stages', () => {
    it('should set stage to Not Writing if user is not writing', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestTableOfContents: {
            is_writing: false,
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        addTableOfContentsStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Not Writing');
    });

    it('should set stage to Pre-Encyclopedia when writing first volume', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestTableOfContents: {
            is_writing: true,
            current_book: {
                volume: 0,
            },
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        addTableOfContentsStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Pre-Encyclopedia');
    });

    it('should set stage to Encyclopeda when writing after first volume', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestTableOfContents: {
            is_writing: true,
            current_book: {
                volume: 1,
            },
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        addTableOfContentsStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Encyclopedia');
    });
});
