import { z } from 'zod';

export const environmentAttributesSchema = z.union([
    z.object({}),
]);

export type EnvironmentAttributes = z.infer<typeof environmentAttributesSchema>;
