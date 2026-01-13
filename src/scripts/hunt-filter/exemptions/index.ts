import type { IMessageExemption } from '../interfaces';

import { acolyteRealmExemptions } from './environments/acolyteRealm';
import { afterwordAcresExemptions } from './environments/afterwordAcres';
import { bountifulBeanstalkExemptions } from './environments/bountifulBeanstalk';
import { clawShotCityExemptions } from './environments/clawShotCity';
import { conclusionCliffsExemptions } from './environments/conclusionCliffs';
import { draconicDepthsExemptions } from './environments/draconicDepth';
import { epilogueFallsExemptions } from './environments/epilogueFalls';
import { floatingIslandsExemptions } from './environments/floatingIslands';
import { gnawnianExpressStationExemptions } from './environments/gnawnianExpressStation';
import { harbourExemptions } from './environments/harbour';
import { icebergExemptions } from './environments/iceberg';
import { iceFortressExemptions } from './environments/iceFortress';
import { schoolOfSorceryExemptions } from './environments/schoolOfSorcery';
import { superBrieFactoryExemptions } from './environments/superBrieFactory';
import { valourRiftExemptions } from './environments/valourRift';
import { globalExemptions } from './global';

export const MessageExemptions: IMessageExemption[] = [
    ...globalExemptions,

    ...acolyteRealmExemptions,
    ...afterwordAcresExemptions,
    ...bountifulBeanstalkExemptions,
    ...clawShotCityExemptions,
    ...conclusionCliffsExemptions,
    ...draconicDepthsExemptions,
    ...epilogueFallsExemptions,
    ...floatingIslandsExemptions,
    ...gnawnianExpressStationExemptions,
    ...harbourExemptions,
    ...icebergExemptions,
    ...iceFortressExemptions,
    ...schoolOfSorceryExemptions,
    ...superBrieFactoryExemptions,
    ...valourRiftExemptions,
];
