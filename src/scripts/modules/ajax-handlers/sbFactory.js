import {AjaxSuccessHandler} from "./ajaxSuccessHandler";

/**
 * @typedef { import("@scripts/util/logger").LoggerService } LoggerService
 */

class SBFactoryAjaxHandler extends AjaxSuccessHandler {
    /**
     * Create a new instance of SuperBrieFactoryHandler
     * @param {LoggerService} logger
     * @param {(convertible: HgItem, items: HgItem[]) => void} submitConvertibleCallback
     */
    constructor(logger, submitConvertibleCallback) {
        super();
        this.logger = logger;
        this.submitConvertibleCallback = submitConvertibleCallback;
    }

    /**
     * Determine if given url applies to this handler
     * @param {string} url
     * @returns True if this handler applies, otherwise false
     */
    match(url) {
        return url.includes("mousehuntgame.com/managers/ajax/events/birthday_factory.php");
    }

    async execute(responseJSON) {
        this.recordSnackPack(responseJSON);
    }

    /**
     * Record Birthday 2021 snack pack submissions as convertibles in MHCT
     * @param {Object <string, any>} settings The user's extension settings.
     * @param {JQuery.jqXHR} xhr jQuery-wrapped XMLHttpRequest object encapsulating the http request to the remote server (HG).
     */
    recordSnackPack(responseJSON) {
        const {vending_machine_purchase: purchase} = responseJSON ?? {};
        if (!purchase?.type) {
            this.logger.debug('Skipped Bday 2021 snack pack submission due to unhandled XHR structure');
            this.logger.warn({message: 'Unable to parse bday 2021 response', responseJSON});
            return;
        }

        // Convert pack code names to made-up internal identifiers
        const packs = {
            larry_starter_mix_snack_pack:	130001,
            tribal_crunch_snack_pack:	130002,
            wild_west_ranch_rings_snack_pack:	130003,
            sandy_bert_bites_snack_pack:	130004,
            hollow_heights_party_pack_snack_pack:	130005,
            riftios_snack_pack:	130006,
            story_seeds_snack_pack: 130007,
        };
        const convertible = {};
        if (purchase.type in packs) {
            convertible["name"] = purchase.type;
            convertible["id"] = packs[purchase.type];
            convertible["quantity"] = purchase.quantity;
        }
        const cheeses = {
            'Gauntlet Cheese Tier 7': 92,
            'Rumble Cheese': 110,
            'Runny Cheese': 907,
            'Onyx Gorgonzola': 106,
            'Gauntlet Cheese Tier 5': 90,
            'Gauntlet Cheese Tier 6': 91,
            'Magical Rancid Radioactive Blue Cheese': 2369,
            'Gauntlet Cheese Tier 4': 89,
            'Maki Cheese': 103,
            'Gauntlet Cheese Tier 8': 93,
            'Runic Cheese': 111,
            'Brie Cheese': 80,
            'Cherry Cheese': 343,
            'Crimson Cheese': 2700,
            'Abominable Asiago Cheese': 2470,
            'Limelight Cheese': 101,
            'Ancient Cheese': 79,
            'Wicked Gnarly Cheese': 121,
            'Susheese Cheese': 115,
            'Glutter Cheese': 96,
            'Grilled Cheese': 1529,
            'Combat Cheese': 82,
            'Radioactive Blue Cheese': 108,
            'Rancid Radioactive Blue Cheese': 1340,
            'Gauntlet Cheese Tier 3': 88,
            'Gauntlet Cheese Tier 2': 87,
            'Chedd-Ore Cheese': 2471,
            'Gnarled Cheese': 97,
            'Vanilla Stilton Cheese': 118,
            'Inferno Havarti Cheese': 100,
            'Galleon Gouda': 1814,
            'Vengeful Vanilla Stilton Cheese': 119,
            'Shell Cheese': 112,
            'Gumbo Cheese': 99,
            'Crunchy Cheese': 84,
            'Sweet Havarti Cheese': 116,
            'Spicy Havarti Cheese': 113,
            'Pungent Havarti Cheese': 107,
            'Magical Havarti Cheese': 102,
            'Crunchy Havarti Cheese': 85,
            'Creamy Havarti Cheese': 83,
            'Mild Queso': 2629,
            'Moon Cheese': 105,
            'Wildfire Queso': 2630,
            'Medium Queso': 2628,
            'Hot Queso': 2627,
            "Flamin' Queso": 2626,
            'Crescent Cheese': 2226,
            'Dewthief Camembert': 1007,
            'Lunaria Camembert': 1010,
            'Graveblossom Camembert': 1009,
            'Duskshade Camembert': 1008,
            'Plumepearl Herbs': 996,
            'Lunaria Petal': 991,
            'Graveblossom Petal': 990,
            'Duskshade Petal': 977,
            'Dreamfluff Herbs': 976,
            'Dewthief Petal': 975,
            'Windy Cheese': 2442,
            'Rainy Cheese': 2441,
            'Mineral Cheese': 1734,
            'Glowing Gruyere Cheese': 1733,
            'Gemstone Cheese': 1732,
            'Cloud Cheesecake': 3089,
            'Sky Pirate Swiss Cheese': 3090,
            'Dragonvine Cheese': 2440,
            'Diamond Cheese': 1731,
            'Rift Rumble Cheese': 2101,
            'Polluted Parmesan Cheese': 1550,
            'Gauntlet String Cheese': 2906,
            'Runic String Cheese': 2344,
            'Resonator Cheese': 1425,
            'Lactrodectus Lancashire Cheese': 1646,
            'Master Fusion Cheese': 2099,
            'Maki String Cheese': 2080,
            'Magical String Cheese': 1426,
            'Ancient String Cheese': 2343,
            'Riftiago Cheese': 1428,
            'Terre Ricotta Cheese': 1551,
            'Rift Susheese': 2102,
            'Rift Glutter Cheese': 2097,
            'Rift Combat Cheese': 2096,
            'Null Onyx Gorgonzola': 2100,
            'Extra Rich Cloud Cheesecake': 3274,
        };
        const items = [];
        if ("items" in purchase) {
            purchase.items.forEach(item => {
                items.push({
                    id: cheeses[item.name],
                    name: item.name,
                    quantity: item.quantity,
                });
            });
        }
        this.logger.debug({convertible, items});
        this.submitConvertibleCallback(convertible, items);
    }
}

export {SBFactoryAjaxHandler};
