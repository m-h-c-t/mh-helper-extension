import * as quests from './quests';

export type EnvironmentAttributes = quests.ValourRiftEnvironmentAttributes |
    Record<string, never>;
