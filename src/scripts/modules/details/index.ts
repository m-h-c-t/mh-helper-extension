import type { IDetailer, IEnvironmentDetailer } from './details.types';

import { BristleWoodsRiftDetailer } from './environments/bristleWoodsRift';
import { ClawShotCityDetailer } from './environments/clawShotCity';
import { DraconicDepthsDetailer } from './environments/draconicDepths';
import { EpilogueFallsDetailer } from './environments/epilogueFalls';
import { FieryWarpathDetailer } from './environments/fieryWarpath';
import { FortRoxDetailer } from './environments/fortRox';
import { HarbourDetailer } from './environments/harbour';
import { IceFortressDetailer } from './environments/iceFortress';
import { SandCryptsDetailer } from './environments/sandCrypts';
import { TableOfContentsDetailer } from './environments/tableOfContents';
import { ValourRiftDetailer } from './environments/valourRift';
import { WhiskerWoodsRiftDetailer } from './environments/whiskerWoodsRift';
import { ZokorDetailer } from './environments/zokor';
import { ZugzwangsTowerDetailer } from './environments/zugzwangsTower';
import { HalloweenDetailer } from './global/halloween';
import { LuckyCatchDetailer } from './global/luckyCatch';
import { PillageDetailer } from './global/pillage';

// Detailer for specific location
const environmentDetailerModules: IEnvironmentDetailer[] = [
    new BristleWoodsRiftDetailer(),
    new ClawShotCityDetailer(),
    new DraconicDepthsDetailer(),
    new EpilogueFallsDetailer(),
    new FieryWarpathDetailer(),
    new FortRoxDetailer(),
    new HarbourDetailer(),
    new IceFortressDetailer(),
    new SandCryptsDetailer(),
    new TableOfContentsDetailer(),
    new ValourRiftDetailer(),
    new WhiskerWoodsRiftDetailer(),
    new ZokorDetailer(),
    new ZugzwangsTowerDetailer(),
];

// Detailers that don't match on location (LNY, Halloween)
const globalDetailerModules: IDetailer[] = [
    new HalloweenDetailer(),
    new LuckyCatchDetailer(),
    new PillageDetailer(),
];

export {environmentDetailerModules, globalDetailerModules};
