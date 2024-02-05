import {ToxicSpillStager} from "@scripts/modules/stages/environments/toxicSpill";
import {IStager} from "@scripts/modules/stages/stages.types";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {PollutionTitle, PollutionTitleStatus, PollutionTitles} from "@scripts/types/quests";

describe('Toxic Spill stages', () => {
    let stager: IStager;

    beforeEach(() => {
        stager = new ToxicSpillStager();
    });

    it('should be for the Toxic Spill environment', () => {
        expect(stager.environment).toBe('Toxic Spill');
    });

    it.each([undefined, null])('should throw when pre-User QuestPollutionOutbreak is %p', (quest) => {
        const message = {location: {}} as IntakeMessage;
        const preUser = {quests: {QuestPollutionOutbreak: quest}} as User;
        const postUser = {quests: {QuestPollutionOutbreak: {
            titles: generateTitlesWithActive('archduke_archduchess'),
        }}} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestPollutionOutbreak is undefined');
    });

    it.each([undefined, null])('should throw when post-User QuestPollutionOutbreak is %p', (quest) => {
        const message = {location: {}} as IntakeMessage;
        const preUser = {quests: {QuestPollutionOutbreak: {
            titles: generateTitlesWithActive('baron_baroness'),
        }}} as User;
        const postUser = {quests: {QuestPollutionOutbreak: quest}} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestPollutionOutbreak is undefined');
    });

    it.each`
        activeTitle                 | expected
        ${'hero'}                   | ${'Hero'}
        ${'knight'}                 | ${'Knight'}
        ${'lord_lady'}              | ${'Lord/Lady'}
        ${'baron_baroness'}         | ${'Baron/Baroness'}
        ${'count_countess'}         | ${'Count/Countess'}
        ${'duke_dutchess'}          | ${'Duke/Duchess'}
        ${'grand_duke'}             | ${'Grand Duke/Duchess'}
        ${'archduke_archduchess'}   | ${'Archduke/Archduchess'}
    `('should set stage to $expected when pre+post active title is $activeTitle', ({activeTitle, expected}) => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestPollutionOutbreak: {
            titles: generateTitlesWithActive(activeTitle),
        }}} as User;
        const postUser = {quests: {QuestPollutionOutbreak: {
            titles: generateTitlesWithActive(activeTitle),
        }}} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should throw for unknown active title', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestPollutionOutbreak: {
            titles: {...generateTitles(), ...{sage: {active: true}}},
        }}} as unknown as User;
        const postUser = {quests: {QuestPollutionOutbreak: {
            titles: generateTitlesWithActive('grand_duke'),
        }}} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping hunt due to unknown active title');

        expect(() => stager.addStage(message, postUser, preUser, journal))
            .toThrow('Skipping hunt due to unknown active title');
    });

    it('should throw when active title changes server side', () => {
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestPollutionOutbreak: {
            titles: generateTitlesWithActive('archduke_archduchess'),
        }}} as User;
        const postUser = {quests: {QuestPollutionOutbreak: {
            titles: generateTitlesWithActive('grand_duke'),
        }}} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping hunt during server-side pollution change');
    });

    function generateTitlesWithActive(activeTitle: PollutionTitle): Record<PollutionTitle, PollutionTitleStatus> {
        const titles = generateTitles();
        titles[activeTitle].active = true;
        return titles;
    }

    function generateTitles(): Record<PollutionTitle, PollutionTitleStatus> {
        return PollutionTitles.reduce((acc, title) => {
            return {
                ...acc,
                [title]: {active: false},
            };
        }, {} as Record<PollutionTitle, PollutionTitleStatus>);
    }
});

