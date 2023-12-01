import {type IStager} from './stages.types';
import {BalacksCoveStager} from './environments/balacksCove';
import {BountifulBeanstalkStager} from './environments/bountifulBeanstalk';
import {ClawShotCityStager} from './environments/clawShotCity';
import {FloatingIslandsStager} from './environments/floatingIslands';
import {ForbiddenGroveStager} from './environments/forbiddenGrove';
import {FungalCavernStager} from './environments/fungalCavern';
import {HarbourStager} from './environments/harbour';
import {IceFortressStager} from './environments/iceFortress';
import {LabyrinthStager} from './environments/labyrinth';
import {LivingGardenStager} from './environments/livingGarden';
import {MoussuPicchuStager} from './environments/moussuPicchu';
import {MousoleumStager} from './environments/mousoleum';
import {MuridaeMarketStager} from './environments/muridaeMarket';
import {SlushyShorelineStager} from './environments/slushyShoreline';
import {SuperBrieFactoryStager} from './environments/superBrieFactory';
import {TwistedGardenStager} from './environments/twistedGarden';

const stageModules: IStager[]  = [
    new BalacksCoveStager(),
    new BountifulBeanstalkStager(),
    new ClawShotCityStager(),
    new FloatingIslandsStager(),
    new ForbiddenGroveStager(),
    new FungalCavernStager(),
    new HarbourStager(),
    new IceFortressStager(),
    new LabyrinthStager(),
    new LivingGardenStager(),
    new MoussuPicchuStager(),
    new MousoleumStager(),
    new MuridaeMarketStager(),
    new SlushyShorelineStager(),
    new SuperBrieFactoryStager(),
    new TwistedGardenStager(),
];

export {stageModules};
