
export class CustomConvertibleIds {
    // KGA
    public static readonly KingsMiniPrizePack: number = 130008;
    public static readonly KingsGiveawayVault: number = 130009;

    // Halloween
    public static readonly HalloweenSpookyShuffleNovice = 130010;
    public static readonly HalloweenSpookyShuffleNoviceDusted = 130011;
    public static readonly HalloweenSpookyShuffleMaster = 130012;
    public static readonly HalloweenSpookyShuffleMasterDusted = 130013;
    public static readonly HalloweenSpookyShuffleBaron = 130014;
    public static readonly HalloweenSpookyShuffleBaronDusted = 130015;
    public static readonly HalloweenSpookyShuffleGrandDuke = 130016;
    public static readonly HalloweenSpookyShuffleGrandDukeDusted = 130017;
}

/**
 * Represents event vanishing dates at which point no more ajax requests will be processed.
 *
 * NOT the end date of the event.
 */
export class EventDates {
    // KGA
    public static readonly KingsGiveawayEndDate: Date = new Date("2023-10-03T15:00:00Z");

    // GWH
    public static readonly GreatWinterHuntEndDate: Date = new Date("2024-01-16T16:00:00Z");
}
