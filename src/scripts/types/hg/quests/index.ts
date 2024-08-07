import {z} from "zod";
import {questAncientCitySchema} from "./zokor";
import {questBalacksCoveSchema} from "./balacksCove";
import {questBountifulBeanstalkSchema} from "./bountifulBeanstalk";
import {questClawShotCitySchema} from "./clawShotCity";
import {questDraconicDepthsSchema} from "./draconicDepths";
import {questFloatingIslandsSchema} from "./floatingIslands";
import {questForbiddenGroveSchema} from "./forbiddenGrove";
import {questForewordFarmSchema} from "./forewordFarm";
import {questFortRoxSchema} from "./fortRox";
import {questHalloweenBoilingCauldronSchema} from "./halloween";
import {questHarbourSchema} from "./harbour";
import {questIcebergSchema} from "./iceberg";
import {questIceFortressSchema} from "./iceFortress";
import {questLabyrinthSchema} from "./labyrinth";
import {questLivingGardenSchema} from "./livingGarden";
import {questLostCitySchema} from "./lostCity";
import {questMousoleumSchema} from "./mousoleum";
import {questMoussuPicchuSchema} from "./moussuPicchu";
import {questPollutionOutbreakSchema} from "./toxicSpill";
import {questQuesoGeyserSchema} from "./quesoGeyser";
import {questRiftBristleWoodsSchema} from "./bristleWoodsRift";
import {questRiftBurroughsSchema} from "./burroughsRift";
import {questRiftFuromaSchema} from "./furomaRift";
import {questRiftValourSchema} from "./valourRift";
import {questRiftWhiskerWoodsSchema} from "./whiskerWoodsRift";
import {questSandDunesSchema} from "./sandDunes";
import {questSchoolOfSorcerySchema} from "./schoolOfSorcery";
import {questSpringHuntSchema} from "./springHunt";
import {questSunkenCitySchema} from "./sunkenCity";
import {questSuperBrieFactorySchema} from "./superBrieFactory";
import {questTableOfContentsSchema} from "./tableOfContents";
import {questTrainStationSchema} from "./gnawnianExpressStation";

export const questsSchema = z.object({
    QuestAncientCity: questAncientCitySchema.optional(),
    QuestBalacksCove: questBalacksCoveSchema.optional(),
    QuestBountifulBeanstalk: questBountifulBeanstalkSchema.optional(),
    QuestClawShotCity: questClawShotCitySchema.optional(),
    QuestDraconicDepths: questDraconicDepthsSchema.optional(),
    QuestFloatingIslands: questFloatingIslandsSchema.optional(),
    QuestForbiddenGrove: questForbiddenGroveSchema.optional(),
    QuestForewordFarm: questForewordFarmSchema.optional(),
    QuestFortRox: questFortRoxSchema.optional(),
    QuestHalloweenBoilingCauldron: questHalloweenBoilingCauldronSchema.optional(),
    QuestHarbour: questHarbourSchema.optional(),
    QuestIceberg: questIcebergSchema.optional(),
    QuestIceFortress: questIceFortressSchema.optional(),
    QuestLabyrinth: questLabyrinthSchema.optional(),
    QuestLivingGarden: questLivingGardenSchema.optional(),
    QuestLostCity: questLostCitySchema.optional(),
    QuestMousoleum: questMousoleumSchema.optional(),
    QuestMoussuPicchu: questMoussuPicchuSchema.optional(),
    QuestPollutionOutbreak: questPollutionOutbreakSchema.optional(),
    QuestQuesoGeyser: questQuesoGeyserSchema.optional(),
    QuestRiftBristleWoods: questRiftBristleWoodsSchema.optional(),
    QuestRiftBurroughs: questRiftBurroughsSchema.optional(),
    QuestRiftFuroma: questRiftFuromaSchema.optional(),
    QuestRiftValour: questRiftValourSchema.optional(),
    QuestRiftWhiskerWoods: questRiftWhiskerWoodsSchema.optional(),
    QuestSandDunes: questSandDunesSchema.optional(),
    QuestSchoolOfSorcery: questSchoolOfSorcerySchema.optional(),
    QuestSpringHunt: questSpringHuntSchema.optional(),
    QuestSunkenCity: questSunkenCitySchema.optional(),
    QuestSuperBrieFactory: questSuperBrieFactorySchema.optional(),
    QuestTableOfContents: questTableOfContentsSchema.optional(),
    QuestTrainStation: questTrainStationSchema.optional(),
});

export type Quests = z.infer<typeof questsSchema>;

export * from "./balacksCove";
export * from "./bountifulBeanstalk";
export * from "./bristleWoodsRift";
export * from "./burroughsRift";
export * from "./clawShotCity";
export * from "./floatingIslands";
export * from "./forbiddenGrove";
export * from "./forewordFarm";
export * from "./fortRox";
export * from "./furomaRift";
export * from "./gnawnianExpressStation";
export * from "./halloween";
export * from "./harbour";
export * from "./iceFortress";
export * from "./iceberg";
export * from "./labyrinth";
export * from "./livingGarden";
export * from "./lostCity";
export * from "./mousoleum";
export * from "./moussuPicchu";
export * from "./quesoGeyser";
export * from "./sandDunes";
export * from "./schoolOfSorcery";
export * from "./springHunt";
export * from "./sunkenCity";
export * from "./superBrieFactory";
export * from "./tableOfContents";
export * from "./toxicSpill";
export * from "./valourRift";
export * from "./whiskerWoodsRift";
export * from "./zokor";
