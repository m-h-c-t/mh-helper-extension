import {addToxicSpillStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Toxic Spill stages', () => {

    const PollutionTitles = [
        'hero',
        'knight',
        'lord_lady',
        'baron_baroness',
        'count_countess',
        'duke_dutchess',
        'grand_duke',
        'archduke_archduchess',
    ] as const;
    type PollutionTitle = typeof PollutionTitles[number];
    type PollutionTitleStatus = {
        active: boolean
    }

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
            titles: generateTitles(activeTitle),
        }}} as User;
        const postUser = {quests: {QuestPollutionOutbreak: {
            titles: generateTitles(activeTitle),
        }}} as User;
        const journal = {};

        addToxicSpillStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should set location to null when active title changes server side', () => {
        const message = {location: {}} as IntakeMessage;
        const preUser = {quests: {QuestPollutionOutbreak: {
            titles: generateTitles('archduke_archduchess'),
        }}} as User;
        const postUser = {quests: {QuestPollutionOutbreak: {
            titles: generateTitles('grand_duke'),
        }}} as User;
        const journal = {};

        expect(message.location).not.toBeNull();

        addToxicSpillStage(message, preUser, postUser, journal);

        expect(message.location).toBeNull();
    });

    function generateTitles(activeTitle: PollutionTitle): Record<PollutionTitle, PollutionTitleStatus> {
        return PollutionTitles.reduce((acc, title) => {
            return {
                ...acc,
                [title]: {active: title === activeTitle},
            };
        }, {} as Record<PollutionTitle, PollutionTitleStatus>);
    }
});

