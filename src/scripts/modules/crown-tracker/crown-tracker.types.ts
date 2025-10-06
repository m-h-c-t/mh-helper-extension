import z from 'zod';

export const Crowns = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;
export type CrownType = (typeof Crowns)[number];

export const crownDataSchema = z.object({
    user: z.string().min(1),
    crowns: z.record(z.enum(Crowns), z.number())
});

export type CrownData = z.infer<typeof crownDataSchema>;

export type CrownTrackerSubmitResult = {
    success: true;
    count: number;
} | {
    success: false;
    error: string;
};

export interface CrownTrackerProtocolMap {
    submitCrowns(data: CrownData): CrownTrackerSubmitResult;
}
