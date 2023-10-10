import {type IStager} from './stages.types';
import {BountifulBeanstalkStager} from './environments/bountifulBeanstalk';
import {ClawShotCityStager} from './environments/clawShotCity';
import {FloatingIslandsStager} from './environments/floatingIslands';
import {ForbiddenGroveStager} from './environments/forbiddenGrove';
import {FungalCavernStager} from './environments/fungalCavern';
import {HarbourStager} from './environments/harbour';
import {IceFortressStager} from './environments/iceFortress';
import {MousoleumStager} from './environments/mousoleum';
import {SuperBrieFactoryStager} from './environments/superBrieFactory';

const stageModules: IStager[]  = [
    new BountifulBeanstalkStager(),
    new ClawShotCityStager(),
    new FloatingIslandsStager(),
    new ForbiddenGroveStager(),
    new FungalCavernStager(),
    new HarbourStager(),
    new IceFortressStager(),
    new MousoleumStager(),
    new SuperBrieFactoryStager(),
];

export {stageModules};
