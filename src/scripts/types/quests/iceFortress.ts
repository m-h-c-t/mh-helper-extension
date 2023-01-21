export interface QuestIceFortress {
    cannons: Record<CannonType, Cannon>;
    shield: {
        is_broken: boolean;
    }
}

type CannonType = 'snow_cannon' | 'cinnamon_cannon' | 'charm_cannon';

interface Cannon {
    is_enabled: true | null;
    is_active: true | null;
    just_fired: true | null;
    state: 'firing' | 'disabled' | 'holding' | 'noAmmo';
}
