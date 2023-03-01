import { type IStager } from './stages.types';
import { IceFortressStager } from './environments/iceFortress';
import { SuperBrieFactoryStager } from './environments/superBrieFactory';

const stageModules: IStager[]  = [
    new IceFortressStager(),
    new SuperBrieFactoryStager(),
];

export { stageModules }
