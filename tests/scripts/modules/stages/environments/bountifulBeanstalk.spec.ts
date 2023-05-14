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
        floorName               | roomName                              | expected
        ${'Dungeon Floor'}      | ${'Standard Mystery Room'}            | ${'Dungeon - Mystery'}
        ${'Ballroom Floor'}     | ${'Extreme Magic Bean Room'}          | ${'Ballroom - Magic'}
        ${'Great Hall Floor'}   | ${'Ultimate Royal Ruby Bean Room'}    | ${'Great Hall - Royal Ruby'}
    `('should set stage to $expected when castle floor name is $floorName and in $roomName room', ({floorName, roomName, expected}) => {
        preUser.quests.QuestBountifulBeanstalk = createCastleAttributes({floor: floorName, room: roomName});

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should append Giant to stage under boss encounter', () => {
        const castle = {
            floor: 'Fee Fi Fo Fum Floor',
            room: 'Standard English Man Room',
        };
        const isBossEncounter = true;
        preUser.quests.QuestBountifulBeanstalk = createCastleAttributes(castle, isBossEncounter);

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe('Fee Fi Fo Fum Giant - English Man');
    });

});

export function getDefaultQuest(): QuestBountifulBeanstalk {
    return createBeanstalkAttributes();
}

/**
 *
 * @param isBossEncounter
 * @returns Object with quest attributes when on the beanstalk
 */
export function createBeanstalkAttributes(isBossEncounter = false): BeanstalkAttributes {
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
export function createCastleAttributes(castle: {floor: string, room: string}, isBossEncounter = false): CastleAttributes {
    return {
        in_castle: true,
        castle: {
            is_boss_encounter: isBossEncounter,
            current_floor: {
                name: castle.floor,
            },
            current_room: {
                name: castle.room,
            },
        },
    };
}
