import {SchoolOfSorceryStager} from "@scripts/modules/stages/environments/schoolOfSorcery";
import {IStager} from "@scripts/modules/stages/stages.types";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import type {CourseSelection, CourseType, QuestSchoolOfSorcery} from "@scripts/types/hg/quests";

describe('School of Sorcery stages', () => {
    let stager: IStager;
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        stager = new SchoolOfSorceryStager();
        message = {} as IntakeMessage;
        preUser = {quests: {
            QuestSchoolOfSorcery: getDefaultQuest(),
        }} as User;
        postUser = {} as User;
    });

    it('should be for the School of Sorcery environment', () => {
        expect(stager.environment).toBe('School of Sorcery');
    });

    it('it should throw when quest is undefined', () => {
        preUser.quests.QuestSchoolOfSorcery = undefined;

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestSchoolOfSorcery is undefined');
    });

    it('should set stage to Hallway when not in a course', () => {
        preUser.quests.QuestSchoolOfSorcery!.in_course = false;

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Hallway');
    });

    it.each<{courseType: CourseType, powerType: 'arcane' | 'shadow', expected: string}>([
        {courseType: 'arcane_101_course',   powerType: 'arcane', expected: 'Arcane Arts'},
        {courseType: 'shadow_101_course',   powerType: 'shadow', expected: 'Shadow Sciences'},
        {courseType: 'exam_course',         powerType: 'arcane', expected: 'Final Exam - Arcane'},
        {courseType: 'exam_course',         powerType: 'shadow', expected: 'Final Exam - Shadow'},
    ])('should set stage to $expected when taking course $courseType', ({courseType, powerType, expected}) => {
        preUser.quests.QuestSchoolOfSorcery!.in_course = true;
        if (preUser.quests.QuestSchoolOfSorcery?.in_course) {
            preUser.quests.QuestSchoolOfSorcery.current_course = {
                course_type: courseType,
                is_boss_encounter: false,
                power_type: powerType,
            };
        }

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it.each<{courseType: CourseType, powerType: 'arcane' | 'shadow', expected: string}>([
        {courseType: 'arcane_101_course',   powerType: 'arcane', expected: 'Arcane Arts Boss'},
        {courseType: 'shadow_101_course',   powerType: 'shadow', expected: 'Shadow Sciences Boss'},
        {courseType: 'exam_course',         powerType: 'arcane', expected: 'Final Exam Boss'},
        {courseType: 'exam_course',         powerType: 'shadow', expected: 'Final Exam Boss'},
    ])('should set stage to $expected when encountering $courseType boss', ({courseType, powerType, expected}) => {
        preUser.quests.QuestSchoolOfSorcery!.in_course = true;
        if (preUser.quests.QuestSchoolOfSorcery?.in_course) {
            preUser.quests.QuestSchoolOfSorcery.current_course = {
                course_type: courseType,
                is_boss_encounter: true,
                power_type: powerType,
            };
        }

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

});

export function createCourseAttributes(course: {courseType: CourseType, powerType: 'arcane' | 'shadow'}, isBossEncounter = false): QuestSchoolOfSorcery {
    return {
        course_selections: getCourseSelections(),
        in_course: true,
        current_course: {
            course_type: course.courseType,
            power_type: course.powerType,
            is_boss_encounter: isBossEncounter,
        },
    };
}

export function createHallwayAttributes(): QuestSchoolOfSorcery {
    return {
        course_selections: getCourseSelections(),
        in_course: false,
    };
}

function getCourseSelections(): CourseSelection[] {
    return [
        {
            type: 'arcane_101_course',
            name: 'Arcane Arts',
        },
        {
            type: 'shadow_101_course',
            name: 'Shadow Sciences',
        },
        {
            type: 'exam_course',
            name: 'Final Exam',
        },
    ];
}

export function getDefaultQuest(): QuestSchoolOfSorcery {
    return createCourseAttributes({courseType: 'arcane_101_course', powerType: 'arcane'});
}
