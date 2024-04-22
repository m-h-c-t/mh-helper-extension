export type QuestSchoolOfSorcery = {
    course_selections: CourseSelection[];
} & (RunningInHallway | TakingACourse);

interface RunningInHallway {
    in_course: false;
}

interface TakingACourse {
    current_course: CurrentCourse;
    in_course: true;
}

export interface CourseSelection {
    type: CourseType;
    name: string;
}

export interface CurrentCourse {
    course_type: CourseType;
    power_type: 'shadow' | 'arcane'
    is_boss_encounter: boolean | null
}

export type CourseType = 'arcane_101_course' | 'shadow_101_course' | 'exam_course';
