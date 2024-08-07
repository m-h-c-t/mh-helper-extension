import {z} from "zod";
import {valourRiftEnvironmentAttributesSchema} from "./quests";

export const environmentAttributesSchema = z.union([
    valourRiftEnvironmentAttributesSchema,
    z.object({}),
]);

export type EnvironmentAttributes = z.infer<typeof environmentAttributesSchema>;
