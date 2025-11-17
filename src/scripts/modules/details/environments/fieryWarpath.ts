import type { FieryWarpathViewingAttributes, JournalMarkup, User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import type { IEnvironmentDetailer } from '../details.types';

export class FieryWarpathDetailer implements IEnvironmentDetailer {
    readonly environment: string = 'Fiery Warpath';

    addDetails(message: IntakeMessage, userPre: User, userPost: User, journal: JournalMarkup): Record<PropertyKey, unknown> | undefined {
        /*
        * Log the mouse populations, remaining total, boss invincibility, and streak data.
        * MAYBE: Record usage of FW charms, e.g. "targeted mouse was attracted"
        * charm_ids 534: Archer, 535: Cavalry, 536: Commander, 537: Mage, 538: Scout, 539: Warrior
        *   540: S Archer, 541: S Cavalry, 542: S Mage, 543: S Scout, 544: S Warrior, 615: S Commander
        */

        this.assertFieryWarpath(userPre);
        this.assertFieryWarpath(userPost);

        const preAttrs = userPre.viewing_atts.desert_warpath;
        const postAttrs = userPost.viewing_atts.desert_warpath;

        const wave = parseInt(String(preAttrs.wave), 10);
        const fw: Record<string, unknown> = {};

        if ([1, 2, 3].includes(wave)) {
            const asType = (name: string) => name.replace(/desert_|_weak|_epic|_strong/g, '');

            if (preAttrs.streak_quantity && preAttrs.streak_quantity > 0) {
                fw.streak_count = preAttrs.streak_quantity;
                fw.streak_type = asType(preAttrs.streak_type);
                fw.streak_increased_on_hunt = (message.caught === 1 &&
                    fw.streak_type === asType(postAttrs.streak_type ?? ''));
            }

            // Track the mice remaining in the wave, per type and in total.
            let remaining = 0;
            [
                'desert_warrior',
                'desert_warrior_weak',
                'desert_warrior_epic',
                'desert_scout',
                'desert_scout_weak',
                'desert_scout_epic',
                'desert_archer',
                'desert_archer_weak',
                'desert_archer_epic',
                'desert_mage',
                'desert_mage_strong',
                'desert_cavalry',
                'desert_cavalry_strong',
                'desert_artillery',
            ].filter(name => preAttrs.mice && name in preAttrs.mice).forEach((mouse) => {
                const mouseData = preAttrs.mice[mouse];
                if (mouseData?.quantity) {
                    const q = mouseData.quantity;
                    fw[`num_${asType(mouse)}`] = q;
                    remaining += q;
                }
            });

            const wave_total = ({1: 105, 2: 185, 3: 260})[wave] ?? 0;
            // Support retreats when 10% or fewer total mice remain.
            fw.morale = remaining / wave_total;

            fw.has_support_mice = (preAttrs.has_support_mice === 'active');
            if (fw.has_support_mice) {
                // Calculate the non-rounded `morale_percent` viewing attribute.
                fw.support_morale = (wave_total - remaining) / (0.9 * wave_total);
            }
        } else if ([4, 'portal'].includes(preAttrs.wave)) {
            // If the Warmonger or Artillery Commander was already caught (i.e. Ultimate Charm),
            // don't record any hunt details since there isn't anything to learn.
            const boss = (message.stage === 'Portal')
                ? preAttrs.mice.desert_artillery_commander
                : preAttrs.mice.desert_boss;
            if (boss?.quantity !== 1) {
                return;
            }
            // Theurgy Wardens are "desert_elite_gaurd". Yes, "gaurd".
            const warden = preAttrs.mice.desert_elite_gaurd;
            fw.num_warden = warden?.quantity ?? 0;
            fw.boss_invincible = !!fw.num_warden;
        } else {
            throw new Error(`Unknown FW Wave "${String(preAttrs.wave)}"`);
        }

        return fw;
    }

    private assertFieryWarpath(user: User): asserts user is User & {viewing_atts: FieryWarpathViewingAttributes} {
        if (!('desert_warpath' in user.viewing_atts) || user.viewing_atts.desert_warpath == null) {
            throw new Error('This detailer only supports Fiery Warpath viewing attributes');
        }
    }
}
