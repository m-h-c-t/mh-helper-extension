import type {IMessageExemption} from '../interfaces';

import {acolyteRealmExemptions} from './environments/acolyteRealm';
import {bountifulBeanstalkExemptions} from './environments/bountifulBeanstalk';
import {superBrieFactoryExemptions} from './environments/superBrieFactory';
import {valourRiftExemptions} from './environments/valourRift';

export const MessageExemptions: IMessageExemption[] = [
    ...acolyteRealmExemptions,
    ...bountifulBeanstalkExemptions,
    ...superBrieFactoryExemptions,
    ...valourRiftExemptions,
];
