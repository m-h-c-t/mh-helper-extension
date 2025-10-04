import type { IMessageExemption } from '@scripts/hunt-filter/interfaces';
import type { IntakeMessage } from '@scripts/types/mhct';

// TODO: Move to quests\ValourRift.ts once made
export const OutsideStages = ['Outside'] as const;
export const NormalFloorStages = ['Floors 1-7', 'Floors 9-15', 'Floors 17-23', 'Floors 25-31+'] as const;
export const UmbraFloorStages = ['UU Floors 1-7', 'UU Floors 9-15', 'UU Floors 17-23', 'UU Floors 25-31+'] as const;
export const FloorStages = [...NormalFloorStages, ...UmbraFloorStages] as const;
export const ValourRiftStages = [...FloorStages, ...OutsideStages] as const;
export type OutsideStage = typeof OutsideStages[number];
export type NormalFloorStage = typeof NormalFloorStages[number];
export type UmbraFloorStage = typeof UmbraFloorStages[number];
export type FloorStage = typeof FloorStages[number];
export type ValourRiftStage = typeof ValourRiftStages[number];

/**
 * Provides an exemption on the 'stage' difference. Iff the mouse was
 * a Valour Rift Eclipse (Normal or Umbra)
 */
class EclipseMouseStageExemption implements IMessageExemption {
    readonly description = 'Eclipse caught in Valour Rift';
    readonly property = 'stage';

    getExemptions(
        pre: IntakeMessage,
        post: IntakeMessage
    ): (keyof IntakeMessage)[] | null {
        if (
            (this.isNormalEclipse(pre) || this.isUmbraEclipse(pre)) &&
            this.isValourRiftStage(post.stage)
        ) {
            return ['stage'];
        }

        return null;
    }

    private isNormalEclipse(message: IntakeMessage): boolean {
        return message.stage === 'Eclipse' && message.mouse === 'Shade of the Eclipse';
    }

    private isUmbraEclipse(message: IntakeMessage): boolean {
        return message.stage === 'UU Eclipse' && message.mouse == 'The Total Eclipse';
    }

    private isValourRiftStage(stage: unknown): boolean {
        return typeof stage === 'string' && ValourRiftStages.includes(stage as ValourRiftStage);
    }
}

export const valourRiftExemptions = [
    new EclipseMouseStageExemption(),
];
