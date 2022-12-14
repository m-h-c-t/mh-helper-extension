import { IStager } from './stages';
import { IceFortressStager } from './iceFortress';

const stageModules: IStager[]  = [
    new IceFortressStager()
];

export { stageModules }
