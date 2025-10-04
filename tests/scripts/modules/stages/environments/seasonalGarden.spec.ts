import type { User } from '@scripts/types/hg';
import type { IntakeMessage } from '@scripts/types/mhct';

import { SeasonalGardenStager } from '@scripts/modules/stages/environments/seasonalGarden';

describe('Seasonal Garden stages', () => {
    it('should be for the "Seasonal Garden" environment', () => {
        const stager = new SeasonalGardenStager();
        expect(stager.environment).toBe('Seasonal Garden');
    });

    it.each`
        season | expected
        ${'sg'} | ${'Spring'}
        ${'sr'} | ${'Summer'}
        ${'fl'} | ${'Fall'}
        ${'wr'} | ${'Winter'}
    `('should set stage based on season', ({season, expected}) => {
        const stager = new SeasonalGardenStager();

        const message = {} as IntakeMessage;
        const preUser = {viewing_atts: {
            season,
        }} as User;
        const postUser = {viewing_atts: {
            season,
        }} as User;
        const journal = {};

        stager.addStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(`${expected}`);
    });

    it('should reject server side season changes', () => {
        const stager = new SeasonalGardenStager();

        const message = {} as IntakeMessage;
        const preUser = {viewing_atts: {
            season: 'sr',
        }} as User;
        const postUser = {viewing_atts: {
            season: 'fl',
        }} as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Skipping hunt due to server side season change');
    });

    it('should throw on unexpected season', () => {
        const stager = new SeasonalGardenStager();

        const message = {} as IntakeMessage;
        const preUser = {viewing_atts: {
            season: 'aa',
        }} as unknown as User;
        const postUser = {viewing_atts: {
            season: 'aa',
        }} as unknown as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Unexpected garden season');
    });

    it.each([undefined, null])('should throw when viewing attributes are %p', (state) => {
        const stager = new SeasonalGardenStager();

        const message = {} as IntakeMessage;
        const preUser = {viewing_atts: {season: state}} as unknown as User;
        const postUser = {viewing_atts: {season: state}} as unknown as User;
        const journal = {};

        expect(() => stager.addStage(message, preUser, postUser, journal))
            .toThrow('Seasonal Garden season not found in user viewing_attributes');
    });
});
