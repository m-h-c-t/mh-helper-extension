import {type IStager} from './stages.types';
import {ForbiddenGroveStager} from './environments/forbiddenGrove';
import {IceFortressStager} from './environments/iceFortress';
import {SuperBrieFactoryStager} from './environments/superBrieFactory';

const stageModules: IStager[]  = [
    new ForbiddenGroveStager(),
    new IceFortressStager(),
    new SuperBrieFactoryStager(),
];

export {stageModules};
