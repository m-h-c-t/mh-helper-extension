import { type IDetailer, type IEnvironmentDetailer } from './details.types';

// Detailer for specific location
const environmentDetailerModules: IEnvironmentDetailer[]  = [
];

// Detailers that don't match on location (LNY, Halloween)
const globalDetailerModules: IDetailer[] = [
];

export { environmentDetailerModules, globalDetailerModules }
