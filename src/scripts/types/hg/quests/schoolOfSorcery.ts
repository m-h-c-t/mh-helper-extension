import {z} from "zod";

const courseTypeSchema = z.enum(['arcane_101_course', 'shadow_101_course', 'exam_course']);
const currentCourseSchema = z.object({
    course_type: courseTypeSchema,
    power_type: z.union([z.literal('shadow'), z.literal('arcane')]),
    is_boss_encounter: z.boolean().nullable(),
});

const courseSelectionSchema = z.object({
    type: courseTypeSchema,
    name: z.string(),
});

const runningInHallwaySchema = z.object({
    in_course: z.literal(false),
});

const takingACourseSchema = z.object({
    current_course: currentCourseSchema,
    in_course: z.literal(true),
});

export const questSchoolOfSorcerySchema = z.intersection(
    z.object({
        course_selections: z.array(courseSelectionSchema),
    }),
    z.union([runningInHallwaySchema, takingACourseSchema]),
);

export type CourseType = z.infer<typeof courseTypeSchema>;
export type CurrentCourse = z.infer<typeof currentCourseSchema>;
export type CourseSelection = z.infer<typeof courseSelectionSchema>;
export type QuestSchoolOfSorcery = z.infer<typeof questSchoolOfSorcerySchema>;
