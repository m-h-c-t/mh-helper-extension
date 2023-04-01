import {type IStager} from './stages.types';
import {BountifulBeanstalkStager} from './environments/bountifulBeanstalk';
import {ForbiddenGroveStager} from './environments/forbiddenGrove';
import {FungalCavernStager} from './environments/fungalCavern';
import {IceFortressStager} from './environments/iceFortress';
import {MousoleumStager} from './environments/mousoleum';
import {SuperBrieFactoryStager} from './environments/superBrieFactory';

const stageModules: IStager[]  = [
    new BountifulBeanstalkStager(),
    new ForbiddenGroveStager(),
    new FungalCavernStager(),
    new IceFortressStager(),
    new MousoleumStager(),
    new SuperBrieFactoryStager(),
];

export {stageModules};
