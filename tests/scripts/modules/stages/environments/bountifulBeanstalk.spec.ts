import {BountifulBeanstalkStager} from "@scripts/modules/stages/environments/bountifulBeanstalk";
import {IStager} from "@scripts/modules/stages/stages.types";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";
import type {BeanstalkAttributes, CastleAttributes, QuestBountifulBeanstalk} from "@scripts/types/quests";

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

    it('should set stage to Beanstalk when on the beanstalk', () => {
        preUser.quests.QuestBountifulBeanstalk = createBeanstalkAttributes();

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Beanstalk');
    });

    it('should set stage to Beanstalk Boss when encountering beanstalk boss', () => {
        const isBossEncounter = true;
        preUser.quests.QuestBountifulBeanstalk = createBeanstalkAttributes(isBossEncounter);

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Beanstalk Boss');
    });

    it.each`
        floorName               | expected
        ${'Dungeon Floor'}      | ${'Dungeon'}
        ${'Ballroom Floor'}     | ${'Ballroom'}
        ${'Great Hall Floor'}   | ${'Great Hall'}
    `('should set stage to $expected when castle floor name is $floorName', ({floorName, expected}) => {
        preUser.quests.QuestBountifulBeanstalk = createCastleAttributes(floorName);

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should append Giant to stage under boss encounter', () => {
        const floor = 'Fee Fi Fo Fum Floor';
        const isBossEncounter = true;
        preUser.quests.QuestBountifulBeanstalk = createCastleAttributes(floor, isBossEncounter);

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Fee Fi Fo Fum Giant');
    });

    function getDefaultQuest(): QuestBountifulBeanstalk {
        return createBeanstalkAttributes();
    }

    /**
     *
     * @param isBossEncounter
     * @returns Object with quest attributes when on the beanstalk
     */
    function createBeanstalkAttributes(isBossEncounter = false): BeanstalkAttributes {
        return {
            in_castle: false,
            beanstalk: {
                is_boss_encounter: isBossEncounter,
            },
        };
    }

    /**
     *
     * @param isBossEncounter
     * @returns Object with quest attributes when in the castle
     */
    function createCastleAttributes(floorName: string, isBossEncounter = false): CastleAttributes {
        return {
            in_castle: true,
            castle: {
                is_boss_encounter: isBossEncounter,
                current_floor: {
                    name: floorName,
                },
            },
        };
    }
});
