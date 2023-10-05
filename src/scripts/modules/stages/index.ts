import {type IStager} from './stages.types';
import {BountifulBeanstalkStager} from './environments/bountifulBeanstalk';
import {FloatingIslandsStager} from './environments/floatingIslands';
import {ForbiddenGroveStager} from './environments/forbiddenGrove';
import {FungalCavernStager} from './environments/fungalCavern';
import {IceFortressStager} from './environments/iceFortress';
import {SuperBrieFactoryStager} from './environments/superBrieFactory';

const stageModules: IStager[]  = [
    new BountifulBeanstalkStager(),
    new FloatingIslandsStager(),
    new ForbiddenGroveStager(),
    new FungalCavernStager(),
    new IceFortressStager(),
    new SuperBrieFactoryStager(),
];

export {stageModules};
