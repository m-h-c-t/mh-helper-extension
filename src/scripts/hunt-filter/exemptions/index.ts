import type {IMessageExemption} from '../interfaces';

import {acolyteRealmExemptions} from './environments/acolyteRealm';
import {superBrieFactoryExemptions} from './environments/superBrieFactory';

export const MessageExemptions: IMessageExemption[] = [
    ...acolyteRealmExemptions,
    ...superBrieFactoryExemptions,
];
