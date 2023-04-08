import {type IStager} from './stages.types';
import {BountifulBeanstalkStager} from './environments/bountifulBeanstalk';
import {ForbiddenGroveStager} from './environments/forbiddenGrove';
import {FungalCavernStager} from './environments/fungalCavern';
import {HarbourStager} from './environments/harbour';
import {IceFortressStager} from './environments/iceFortress';
import {SuperBrieFactoryStager} from './environments/superBrieFactory';

const stageModules: IStager[]  = [
    new BountifulBeanstalkStager(),
    new ForbiddenGroveStager(),
    new FungalCavernStager(),
    new HarbourStager(),
    new IceFortressStager(),
    new SuperBrieFactoryStager(),
];

export {stageModules};
