import {type IStager} from './stages.types';
import {BountifulBeanstalkStager} from './environments/bountifulBeanstalk';
import {ForbiddenGroveStager} from './environments/forbiddenGrove';
import {FungalCavernStager} from './environments/fungalCavern';
import {IceFortressStager} from './environments/iceFortress';
import {MoussuPicchuStager} from './environments/moussuPicchu';
import {SuperBrieFactoryStager} from './environments/superBrieFactory';

const stageModules: IStager[]  = [
    new BountifulBeanstalkStager(),
    new ForbiddenGroveStager(),
    new FungalCavernStager(),
    new IceFortressStager(),
    new MoussuPicchuStager(),
    new SuperBrieFactoryStager(),
];

export {stageModules};
