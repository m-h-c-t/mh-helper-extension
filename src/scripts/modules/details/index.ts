import type {IDetailer, IEnvironmentDetailer} from './details.types';
import {DraconicDepthsDetailer} from './environments/draconicDepths';
import {IceFortressDetailer} from './environments/iceFortress';
import {HalloweenDetailer} from './global/halloween';
import {LunarNewYearDetailer} from './global/lunarNewYear';

// Detailer for specific location
const environmentDetailerModules: IEnvironmentDetailer[]  = [
    new DraconicDepthsDetailer(),
    new IceFortressDetailer(),
];

// Detailers that don't match on location (LNY, Halloween)
const globalDetailerModules: IDetailer[] = [
    new HalloweenDetailer(),
    new LunarNewYearDetailer(),
];

export {environmentDetailerModules, globalDetailerModules};
