import {FungalCavernStager} from "@scripts/modules/stages/environments/fungalCavern";
import {User} from "@scripts/types/hg";

describe("FungalCavernStager", () => {
    const stager = new FungalCavernStager();

    it("is for the Fungal Cavern environment", () => {
        expect(stager.environment).toBe("Fungal Cavern");
    });

    it("is gemology base stage if gemology base is armed", () => {
        const message = {} as any;
        const userPre = {
            base_name: "Gemology Base",
        } as User;
        stager.addStage(message, userPre, {} as User, {});
        expect(message.stage).toBe("Gemology Base");
    });

    it("is not gemology stage if gemology base is not armed", () => {
        const message = {} as any;
        const userPre = {
            base_name: "",
        } as User;
        stager.addStage(message, userPre, {} as User, {});
        expect(message.stage).toBe("Not Gemology");
    });

});