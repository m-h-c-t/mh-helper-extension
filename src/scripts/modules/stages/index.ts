import { type IStager } from './stages.types';
import { IceFortressStager } from './iceFortress';

const stageModules: IStager[]  = [
    new IceFortressStager()
];

export { stageModules }
