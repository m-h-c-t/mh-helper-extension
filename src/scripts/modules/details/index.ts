import type {IDetailer, IEnvironmentDetailer} from './details.types';
import {DraconicDepthsDetailer} from './environments/draconicDepths';
import {IceFortressDetailer} from './environments/iceFortress';
import {HalloweenDetailer} from './global/halloween';
import {LuckyCatchDetailer} from './global/luckyCatch';
import {LunarNewYearDetailer} from './global/lunarNewYear';
import {PillageDetailer} from './global/pillage';

// Detailer for specific location
const environmentDetailerModules: IEnvironmentDetailer[]  = [
    new DraconicDepthsDetailer(),
    new IceFortressDetailer(),
];

// Detailers that don't match on location (LNY, Halloween)
const globalDetailerModules: IDetailer[] = [
    new HalloweenDetailer(),
    new LuckyCatchDetailer(),
    new LunarNewYearDetailer(),
    new PillageDetailer(),
];

export {environmentDetailerModules, globalDetailerModules};
