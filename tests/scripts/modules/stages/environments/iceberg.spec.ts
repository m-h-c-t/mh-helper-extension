import {IcebergStager} from "@scripts/modules/stages/environments/iceberg";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Iceberg Stages', () => {
    it('should be for the "Iceberg" environment', () => {
        const stager = new IcebergStager();
        expect(stager.environment).toBe('Iceberg');
    });

    it.each`
    phase                       | expected
    ${'Treacherous Tunnels'}    | ${'0-300ft'}
    ${'Brutal Bulwark'}         | ${'301-600ft'}
    ${'Bombing Run'}            | ${'601-1600ft'}
    ${'The Mad Depths'}         | ${'1601-1800ft'}
    ${'Icewing\'s Lair'}        | ${'1800ft'}
    ${'Hidden Depths'}          | ${'1801-2000ft'}
    ${'The Deep Lair'}          | ${'2000ft'}
    ${'General'}                | ${'Generals'}
    `('should set stage to $expected when in the $phase phase', ({expected, phase}) => {
        const stager = new IcebergStager();
        const message = {} as IntakeMessage;
        const preUser = {quests: {QuestIceberg: {
            current_phase: phase,
        }}} as User;
        const postUser = {} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(expected);
    });

    it('should should throw on unknown phase', () => {
        const stager = new IcebergStager();
        const message = {location: {}} as IntakeMessage;
        const preUser = {quests: {QuestIceberg: {
            current_phase: 'Aard\'s Lair',
        }}} as unknown as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping unknown Iceberg stage');
    });

    it.each([undefined, null])('should throw when QuestIceberg is %p', (state) => {
        const stager = new IcebergStager();
        const message = {location: {}} as IntakeMessage;
        const preUser = {quests: {QuestIceberg: state}} as User;
        const postUser = {} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('QuestIceberg is undefined');
    });
});
