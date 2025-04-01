import type {IDetailer, IEnvironmentDetailer} from './details.types';
import {IceFortressDetailer} from './environments/iceFortress';
import {HalloweenDetailer} from './global/halloween';

// Detailer for specific location
const environmentDetailerModules: IEnvironmentDetailer[]  = [
    new IceFortressDetailer(),
];

// Detailers that don't match on location (LNY, Halloween)
const globalDetailerModules: IDetailer[] = [
    new HalloweenDetailer(),
];

export {environmentDetailerModules, globalDetailerModules};
