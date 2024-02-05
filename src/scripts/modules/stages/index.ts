import {type IStager} from './stages.types';
import {BalacksCoveStager} from './environments/balacksCove';
import {BountifulBeanstalkStager} from './environments/bountifulBeanstalk';
import {BristleWoodsRiftStager} from './environments/bristleWoodsRift';
import {BurroughsRiftStager} from './environments/burroughsRift';
import {ClawShotCityStager} from './environments/clawShotCity';
import {CursedCityStager} from './environments/cursedCity';
import {FieryWarpathStager} from './environments/fieryWarpath';
import {FloatingIslandsStager} from './environments/floatingIslands';
import {ForbiddenGroveStager} from './environments/forbiddenGrove';
import {FortRoxStager} from './environments/fortRox';
import {FungalCavernStager} from './environments/fungalCavern';
import {HarbourStager} from './environments/harbour';
import {IcebergStager} from './environments/iceberg';
import {IceFortressStager} from './environments/iceFortress';
import {LabyrinthStager} from './environments/labyrinth';
import {LivingGardenStager} from './environments/livingGarden';
import {LostCityStager} from './environments/lostCity';
import {MoussuPicchuStager} from './environments/moussuPicchu';
import {MousoleumStager} from './environments/mousoleum';
import {MuridaeMarketStager} from './environments/muridaeMarket';
import {QuesoGeyserStager} from './environments/quesoGeyser';
import {SandDunesStager} from './environments/sandDunes';
import {SeasonalGardenStager} from './environments/seasonalGarden';
import {SlushyShorelineStager} from './environments/slushyShoreline';
import {SuperBrieFactoryStager} from './environments/superBrieFactory';
import {TableOfContentsStager} from './environments/tableOfContents';
import {TwistedGardenStager} from './environments/twistedGarden';
import {WhiskerWoodsRiftStager} from './environments/whiskerWoodsRift';
import {ZokorStager} from './environments/zokor';

const stageModules: IStager[]  = [
    new BalacksCoveStager(),
    new BountifulBeanstalkStager(),
    new BristleWoodsRiftStager(),
    new BurroughsRiftStager(),
    new ClawShotCityStager(),
    new CursedCityStager(),
    new FieryWarpathStager(),
    new FloatingIslandsStager(),
    new ForbiddenGroveStager(),
    new FortRoxStager(),
    new FungalCavernStager(),
    new HarbourStager(),
    new IcebergStager(),
    new IceFortressStager(),
    new LabyrinthStager(),
    new LivingGardenStager(),
    new LostCityStager(),
    new MoussuPicchuStager(),
    new MousoleumStager(),
    new MuridaeMarketStager(),
    new QuesoGeyserStager(),
    new SandDunesStager(),
    new SeasonalGardenStager(),
    new SlushyShorelineStager(),
    new SuperBrieFactoryStager(),
    new TableOfContentsStager(),
    new TwistedGardenStager(),
    new WhiskerWoodsRiftStager(),
    new ZokorStager(),
];

export {stageModules};
