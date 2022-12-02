import { GWHGolemAjaxHandler } from "@scripts/ajax-handlers/golem";
import { GolemPayload, GolemResponse } from "@scripts/ajax-handlers/golem.types";

jest.mock("@scripts/util/logger");
import { ConsoleLogger } from "@scripts/util/logger";

const logger = new ConsoleLogger();
const handler = new GWHGolemAjaxHandler(logger);

const gwhURL = "mousehuntgame.com/managers/ajax/events/winter_hunt.php";

describe("GWHGolemAjaxHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('match', () => {
    it('is false when url is ignored', () => {
        expect(handler.match("mousehuntgame.com/managers/ajax/events/kings_giveaway.php")).toBe(false);
    });

    it('is false when GWH is done', () => {
        // return the day after our filter
        Date.now = jest.fn(() => new Date("2023-01-22T05:00:00Z").getTime());

        expect(handler.match(gwhURL)).toBe(false);
    });

    it('is true on match during event', () => {
        Date.now = jest.fn(() => new Date("2022-12-07T05:00:00Z").getTime());
        expect(handler.match(gwhURL)).toBe(true);
    });
  });

  describe('execute', () => {
    it('does not call submitGolems with unhandled json', () => {
        handler.submitGolems = jest.fn();

        handler.execute({});

        expect(logger.warn).toHaveBeenCalledWith("Skipped GWH golem submission due to unhandled XHR structure.", {});
        expect(handler.submitGolems).not.toHaveBeenCalled();
    });

    it('calls submitGolems with expected data', () => {
        Date.now = jest.fn(() => 12345);
        handler.submitGolems = jest.fn();

        handler.execute(generateTestResponse(testData.harborPreviewData));

        const expectedPayload: GolemPayload[] = [
            {
                location: "Harbour",
                timestamp: 12345,
                loot: [
                    {
                        name: "Brie Cheese",
                        quantity: 20,
                        rarity: "area",
                    },
                ],
            },
        ];
        expect(handler.submitGolems).toHaveBeenCalledWith(expectedPayload);
});
    });
});

// B/c we don't know where the golem field is located, tests can use this to generate data
// and it can be changed to update all tests at once
function generateTestResponse(golemJSON: GolemResponse): any {
    // act like typical MH response
    return {
        // user: {}
        // messageData: { }
        golem_loot: golemJSON
    }
}

const testData = {
    // Data from CBS. 1 'area' loot from Harbor, Brie Cheese, Quanity 20
  harborPreviewData: {
    items: {
      area: [
        {
          type: "brie_cheese",
          name: "Brie Cheese",
          thumb:
            "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/bait/aebc90e15fce17c104481e8a082257d0.gif?cv=2",
          thumb_transparent:
            "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/bait/transparent_thumb/524dc5ba8f4b3d8b0b4bd4415987e50c.png?cv=2",
          large:
            "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/bait/large/9a8d8cd30ea217263779c4bbef463d69.png?cv=2",
          quantity: 20,
          quantity_formatted: 20,
          quantity_abbreviated: 20,
          css_class: "area",
        },
      ],
      hat: [],
      scarf: [],
    },
    bonus_items: [
      {
        type: "snowball_trinket",
        name: "Snowball Charm",
        thumb:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/trinkets/5858998c0c1a0a26e32d8e1f56df9910.gif?cv=2",
        thumb_transparent:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/trinkets/transparent_thumb/0b499d03d61150a12c52a8e749c7dd79.png?cv=2",
        large:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/trinkets/large/36d3d62f27e2b76944591f86229bc2f0.png?cv=2",
        quantity: 5,
        level: 2,
        is_unlocked: false,
      },
      {
        type: "2014_throwable_snowball_stat_item",
        name: "Throwable Snowball",
        thumb:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/stats/05e482571b4fd5b022d56cddeb4a8f3c.gif?cv=2",
        thumb_transparent:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/stats/transparent_thumb/ede3709d581c4bb7a741d62d5790091f.png?cv=2",
        large:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/stats/large/52d92169f2c0a95e0da01ed0b890ec99.png?cv=2",
        quantity: 4,
        level: 4,
        is_unlocked: false,
      },
      {
        type: "super_brie_cheese",
        name: "SUPER|brie+",
        thumb:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/bait/d3bb758c09c44c926736bbdaf22ee219.gif?cv=2",
        thumb_transparent:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/bait/transparent_thumb/3a23203e08a847b23f7786b322b36f7a.png?cv=2",
        large:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/bait/large/32b20c3984d2f03b132c295ea3b99e7e.png?cv=2",
        quantity: 3,
        level: 6,
        is_unlocked: false,
      },
      {
        type: "festive_ultimate_luck_power_trinket",
        name: "Festive Ultimate Lucky Power Charm",
        thumb:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/trinkets/c0cd806b80606feaffed9bee6db25119.gif?cv=2",
        thumb_transparent:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/trinkets/transparent_thumb/8bc65e4d6be945814daca8f676f0f323.png?cv=2",
        large:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/trinkets/large/1dc0012a889f1faa8a77fdc2dad59177.png?cv=2",
        quantity: 2,
        level: 8,
        is_unlocked: false,
      },
      {
        type: "winter_hunt_2016_floating_crate_convertible",
        name: "Floating Reindeer Crate",
        thumb:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/convertibles/293641356edda0b081699dc1cd87195a.gif?cv=2",
        thumb_transparent:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/convertibles/transparent_thumb/9bd9c04060a9967c87f27043a35b5596.png?cv=2",
        large:
          "http://localhost/MouseHuntLegacy/dev2/application/web/images/items/convertibles/large/c9de49468b3348092360836ac6d4c2ba.png?cv=2",
        quantity: 1,
        level: 10,
        is_unlocked: false,
      },
    ],
    num_upgrade_items: 1,
    num_gilded_charms: 0,
    num_hailstones: 1,
    has_golden_shield: false,
    aura: {
      num_hours: 5,
      end_date: "November 28, 2022 @ 6:42pm (Local Time)",
      is_capped: false,
      cutoff_date: "March 20, 2023 @ 9:24pm",
    },
    environment: {
      type: "harbour",
      name: "Harbour",
    },
    golem: {
      level: 1,
    },
  },
};
