import type {IMessageExemption} from '../interfaces';

import {globalExemptions} from './global';
import {acolyteRealmExemptions} from './environments/acolyteRealm';
import {bountifulBeanstalkExemptions} from './environments/bountifulBeanstalk';
import {clawShotCityExemptions} from './environments/clawShotCity';
import {draconicDepthsExemptions} from './environments/draconicDepth';
import {floatingIslandsExemptions} from './environments/floatingIslands';
import {icebergExemptions} from './environments/iceberg';
import {iceFortressExemptions} from './environments/iceFortress';
import {schoolOfSorceryExemptions} from './environments/schoolOfSorcery';
import {superBrieFactoryExemptions} from './environments/superBrieFactory';
import {valourRiftExemptions} from './environments/valourRift';

export const MessageExemptions: IMessageExemption[] = [
    ...globalExemptions,

    ...acolyteRealmExemptions,
    ...bountifulBeanstalkExemptions,
    ...clawShotCityExemptions,
    ...draconicDepthsExemptions,
    ...icebergExemptions,
    ...iceFortressExemptions,
    ...floatingIslandsExemptions,
    ...schoolOfSorceryExemptions,
    ...superBrieFactoryExemptions,
    ...valourRiftExemptions,
];
