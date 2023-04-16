import {addSeasonalGardenStage} from "@scripts/modules/stages/legacy";
import {User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

describe('Seasonal Garden stages', () => {
    it.each`
        season | expected
        ${'sp'} | ${'Spring'}
        ${'sr'} | ${'Summer'}
        ${'fl'} | ${'Fall'}
        ${'wr'} | ${'Winter'}
    `('should set stage based on season', ({season, expected}) => {
        const message = {} as IntakeMessage;
        const preUser = {viewing_atts: {
            season,
        }} as User;
        const postUser = {viewing_atts: {
            season,
        }} as User;
        const journal = {};

        addSeasonalGardenStage(message, preUser, postUser, journal);

        expect(message.stage).toBe(`${expected}`);
    });

    it('should reject server side season changes', () => {
        const message = {} as IntakeMessage;
        const preUser = {viewing_atts: {
            season: 'sr',
        }} as User;
        const postUser = {viewing_atts: {
            season: 'fl',
        }} as User;
        const journal = {};

        addSeasonalGardenStage(message, preUser, postUser, journal);

        expect(message.location).toBe(null);
    });
});
