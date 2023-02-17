import { type IDetailer, type IEnvironmentDetailer } from './details.types';
import { IceFortressDetailer } from './environments/iceFortress';

// Detailer for specific location
const environmentDetailerModules: IEnvironmentDetailer[]  = [
    new IceFortressDetailer()
];

// Detailers that don't match on location (LNY, Halloween)
const globalDetailerModules: IDetailer[] = [
];

export { environmentDetailerModules, globalDetailerModules }
