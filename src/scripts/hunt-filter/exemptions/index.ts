import type {IMessageExemption} from '../interfaces';

import {acolyteRealmExemptions} from './environments/acolyteRealm';
import {bountifulBeanstalkExemptions} from './environments/bountifulBeanstalk';
import {clawShotCityExemptions} from './environments/clawShotCity';
import {floatingIslandsExemptions} from './environments/floatingIslands';
import {icebergExemptions} from './environments/iceberg';
import {iceFortressExemptions} from './environments/iceFortress';
import {superBrieFactoryExemptions} from './environments/superBrieFactory';
import {valourRiftExemptions} from './environments/valourRift';

export const MessageExemptions: IMessageExemption[] = [
    ...acolyteRealmExemptions,
    ...bountifulBeanstalkExemptions,
    ...clawShotCityExemptions,
    ...icebergExemptions,
    ...iceFortressExemptions,
    ...floatingIslandsExemptions,
    ...superBrieFactoryExemptions,
    ...valourRiftExemptions,
];
