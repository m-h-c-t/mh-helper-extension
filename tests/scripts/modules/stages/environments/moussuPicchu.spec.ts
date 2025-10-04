import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { MoussuPicchuStager } from '@scripts/modules/stages/environments/moussuPicchu';

describe('MoussuPicchuStager', () => {
    const ElementLevels = ['low', 'medium', 'high', 'max'];

    it('should be for the "Moussu Picchu" environment', () => {
        const stager = new MoussuPicchuStager();
        expect(stager.environment).toBe('Moussu Picchu');
    });

    describe.each(ElementLevels)('%p rain level', (rainLevel) => {
        describe.each(ElementLevels)('%p wind level', (windLevel) => {
            it(`should set stage wind and rain levels to ${rainLevel} and ${windLevel}`, () => {
                const stager = new MoussuPicchuStager();

                const message = {} as IntakeMessage;
                const preUser = {quests: {QuestMoussuPicchu: {
                    elements: {
                        rain: {level: rainLevel},
                        wind: {level: windLevel},
                    },
                }}} as User;
                const postUser = {} as User;
                const journal = {};
                stager.addStage(message, preUser, postUser, journal);

                const expected = {
                    rain: `Rain ${rainLevel}`,
                    wind: `Wind ${windLevel}`,
                };
                expect(message.stage).toStrictEqual(expected);
            });
        });
    });

    it.each([undefined, null])('should throw when QuestMoussuPicchu is %p', (quest) => {
        const stager = new MoussuPicchuStager();

        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestMoussuPicchu: quest}} as User;
        const postUser = {} as User;
        const journal = {};
        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestMoussuPicchu is undefined');
    });
});
