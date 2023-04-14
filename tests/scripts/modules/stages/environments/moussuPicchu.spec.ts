import {addMoussuPicchuStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('MoussuPicchuStager', () => {
    const ElementLevels = ['low', 'medium', 'high', 'max'];

    describe.each(ElementLevels)('%p rain level', (rainLevel) => {
        describe.each(ElementLevels)('%p wind level', (windLevel) => {
            it(`should set stage wind and rain levels to ${rainLevel} and ${windLevel}`, () => {

                const message = {} as IntakeMessage;
                const preUser = {quests: {QuestMoussuPicchu: {
                    elements: {
                        rain: {level: rainLevel},
                        wind: {level: windLevel},
                    },
                }}} as User;
                const postUser = {} as User;
                const journal = {};
                addMoussuPicchuStage(message, preUser, postUser, journal);

                const expected = {
                    rain: `Rain ${rainLevel}`,
                    wind: `Wind ${windLevel}`,
                };
                expect(message.stage).toStrictEqual(expected);
            });
        });
    });
});
