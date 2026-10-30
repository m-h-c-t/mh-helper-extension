import type { LinkedHuntContext } from '@scripts/hunt-filter/linkedRules';
import type { LoggerService } from '@scripts/services/logging';

import { getLinkedEntry, LinkedRules } from '@scripts/hunt-filter/linkedRules';

import type { HuntEvidence } from './hunt-evidence';

export function buildLinkedHuntEvidence(ctx: LinkedHuntContext, logger: LoggerService): HuntEvidence | null {
    for (const rule of LinkedRules) {
        if (!rule.isValid(ctx)) {
            logger.debug(`Linked hunt invalid: ${rule.description}`);
            return null;
        }
    }

    const entry = getLinkedEntry(ctx);
    if (!ctx.snapshot || !entry) {
        return null;
    }

    return {type: 'linked', before: ctx.snapshot.response, after: ctx.after, entry};
}
