import type { User } from '@scripts/types/hg';
import type { CourseSelection, CourseType } from '@scripts/types/hg/quests/schoolOfSorcery';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IStager } from '../stages.types';

export class SchoolOfSorceryStager implements IStager {
    readonly environment: string = 'School of Sorcery';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestSchoolOfSorcery;

        if (!quest) {
            throw new Error('QuestSchoolOfSorcery is undefined');
        }

        let stage = '';
        if (!quest.in_course) {
            stage = 'Hallway';
        } else {
            const currentCourse = quest.current_course;
            stage = this.getCourseName(quest.course_selections, currentCourse.course_type);

            if (currentCourse.is_boss_encounter) {
                stage += ' Boss';
            } else if (currentCourse.course_type === 'exam_course') {
                // Final Exam gets current powertype appended

                let powerType: string = currentCourse.power_type;
                // Capitalize first letter
                powerType = powerType.charAt(0).toUpperCase() + powerType.slice(1);
                stage += ` - ${powerType}`;
            }
        }

        message.stage = stage;
    }

    private getCourseName(courseSelections: CourseSelection[], currentCourseType: CourseType): string {
        const course = courseSelections.find(c => c.type === currentCourseType);
        if (!course) {
            throw new Error(`The course type '${currentCourseType}' was not found in the course_selections array`);
        }

        return course.name;
    }
}
