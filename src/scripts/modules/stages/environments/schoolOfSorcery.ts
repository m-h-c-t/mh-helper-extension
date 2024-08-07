import type {User} from '@scripts/types/hg';
import type {IntakeMessage} from '@scripts/types/mhct';
import type {IStager} from '../stages.types';
import type {CourseSelection, CourseType} from '@scripts/types/hg/quests/schoolOfSorcery';


export class SchoolOfSorceryStager implements IStager {
    readonly environment: string = 'School of Sorcery';

    addStage(message: IntakeMessage, userPre: User, userPost: User, journal: unknown): void {
        const quest = userPre.quests.QuestSchoolOfSorcery;

        if (!quest) {
            throw new Error('QuestSchoolOfSorcery is undefined');
        }

        if (!quest.in_course) {
            message.stage = 'Hallway';
        } else {
            const currentCourse = quest.current_course;
            message.stage = this.getCourseName(quest.course_selections, currentCourse.course_type);

            if (currentCourse.is_boss_encounter) {
                message.stage += " Boss";
            } else if (currentCourse.course_type === 'exam_course') {
                // Final Exam gets current powertype appended

                let powerType: string = currentCourse.power_type;
                // Capitalize first letter
                powerType = powerType.charAt(0).toUpperCase() + powerType.slice(1);
                message.stage += ` - ${powerType}`;
            }
        }
    }

    private getCourseName(courseSelections: CourseSelection[], currentCourseType: CourseType): string {
        const course = courseSelections.find(c => c.type === currentCourseType);
        if (!course) {
            throw new Error(`The course type '${currentCourseType}' was not found in the course_selections array`);
        }

        return course.name;
    }
}
