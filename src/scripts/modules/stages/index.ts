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
import {ForewordFarmStager} from './environments/forewardFarm';
import {FortRoxStager} from './environments/fortRox';
import {FungalCavernStager} from './environments/fungalCavern';
import {FuromaRiftStager} from './environments/furomaRift';
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
import {SchoolOfSorceryStager} from './environments/schoolOfSorcery';
import {SeasonalGardenStager} from './environments/seasonalGarden';
import {SlushyShorelineStager} from './environments/slushyShoreline';
import {SunkenCityStager} from './environments/sunkenCity';
import {SuperBrieFactoryStager} from './environments/superBrieFactory';
import {TableOfContentsStager} from './environments/tableOfContents';
import {ToxicSpillStager} from './environments/toxicSpill';
import {TwistedGardenStager} from './environments/twistedGarden';
import {WhiskerWoodsRiftStager} from './environments/whiskerWoodsRift';
import {ValourRiftStager} from './environments/valourRift';
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
    new ForewordFarmStager(),
    new FortRoxStager(),
    new FungalCavernStager(),
    new FuromaRiftStager(),
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
    new SchoolOfSorceryStager(),
    new SeasonalGardenStager(),
    new SlushyShorelineStager(),
    new SunkenCityStager(),
    new SuperBrieFactoryStager(),
    new TableOfContentsStager(),
    new ToxicSpillStager(),
    new TwistedGardenStager(),
    new WhiskerWoodsRiftStager(),
    new ValourRiftStager(),
    new ZokorStager(),
];

export {stageModules};
