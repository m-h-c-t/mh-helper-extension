import {BountifulBeanstalkStager} from "@scripts/modules/stages/environments/bountifulBeanstalk";
import {IStager} from "@scripts/modules/stages/stages.types";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import {QuestBountifulBeanstalk} from "@scripts/types/quests";

describe('Bountiful Beanstalk stages', () => {
    let stager: IStager;
    let message: IntakeMessage;
    let preUser: User;
    let postUser: User;
    const journal = {};

    beforeEach(() => {
        stager = new BountifulBeanstalkStager();
        message = {} as IntakeMessage;
        preUser = {quests: {
            QuestBountifulBeanstalk: getDefaultQuest(),
        }} as User;
        postUser = {} as User;
    });

    it('should be for the Bountiful Beanstalk environment', () => {
        expect(stager.environment).toBe('Bountiful Beanstalk');
    });

    it('it should throw when quest is undefined', () => {
        preUser.quests.QuestBountifulBeanstalk = undefined;

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestBountifulBeanstalk is undefined');
    });

    function getDefaultQuest(): QuestBountifulBeanstalk {
        return {};
    }
});
