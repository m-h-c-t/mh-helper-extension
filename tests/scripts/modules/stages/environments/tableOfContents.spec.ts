import type { IStager } from '@scripts/modules/stages/stages.types';
import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { TableOfContentsStager } from '@scripts/modules/stages/environments/tableOfContents';

describe('Table of Contents stages', () => {
    let stager: IStager;

    beforeEach(() => {
        stager = new TableOfContentsStager();
    });

    it('should be for the Table of Contents environment', () => {
        expect(stager.environment).toBe('Table of Contents');
    });

    it.each([undefined, null])('should throw when QuestTableOfContents is %p', (quest) => {
        const message = {location: {}} as IntakeMessage;
        const preUser = {quests: {QuestTableOfContents: quest}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestTableOfContents is undefined');
    });

    it('should set stage to Not Writing if user is not writing', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestTableOfContents: {
            is_writing: false,
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

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

        stager.addStage(message, preUser, postUser, journal);

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

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Encyclopedia');
    });
});
