import {HgResponse, InventoryItem, JournalMarkup, Quests, User} from "@scripts/types/hg";
import {IntakeMessage} from "@scripts/types/mhct";

function clone<T>(obj: T): T {
    if (obj === undefined || obj === null) {
        return obj;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(JSON.stringify(obj));
}

/*
* Builder pattern classes to help build test data with ease
*/

export class HgResponseBuilder {

    activeTurn?: boolean;
    user?: User;
    page?: unknown;
    journalMarkup?: JournalMarkup[];
    inventory?: Record<string, InventoryItem>;
    trapImage?: { auras: Record<string, {status: 'active' | 'hidden'}> };
    unknown?: object;

    withActiveTurn(active: boolean) {
        this.activeTurn = active;
        return this;
    }

    withUser(user: User) {
        this.user = user;
        return this;
    }

    withPage(page: unknown) {
        this.page = page;
        return this;
    }

    withJournalMarkup(journalMarkup: JournalMarkup[]) {
        this.journalMarkup = journalMarkup;
        return this;
    }

    withInventory(inventory: Record<string, InventoryItem>) {
        this.inventory = inventory;
        return this;
    }

    withAuras(auras: Record<string, {status: 'active' | 'hidden'}>) {
        this.trapImage = {auras};
        return this;
    }

    // This is a placeholder for any other unknown data that may be needed
    withUnknown(unknown: object) {
        this.unknown = unknown;
        return this;
    }

    public build(): HgResponse {
        this.user ??= new UserBuilder().build();
        this.journalMarkup ??= [{
            render_data: {
                entry_id: 0,
                mouse_type: "",
                css_class: "",
                entry_date: "",
                environment: "",
                entry_timestamp: 0,
                text: ""
            }
        }];

        this.trapImage ??= {auras: {}};

        return {
            success: 1,
            active_turn: this.activeTurn,
            user: clone(this.user),
            page: clone(this.page),
            journal_markup: clone(this.journalMarkup),
            inventory: clone(this.inventory),
            trap_image: clone(this.trapImage),
            ...clone(this.unknown),
        };
    }
}

type UserIdentification = Pick<User, 'user_id' | 'sn_user_id' | 'unique_hash' | 'has_shield'>;
type UserTurn = Pick<User, | 'num_active_turns' | 'next_activeturn_seconds'>
type UserEnvironment = Pick<User, 'environment_id' | 'environment_name'>;
type UserTrapStats = Pick<User, 'trap_power' |'trap_luck' |'trap_attraction_bonus' |'trap_power_bonus'>;
type UserWeapon = Pick<User, 'weapon_name' | 'weapon_item_id'>;
type UserBase = Pick<User, 'base_name' | 'base_item_id'>;
type UserBait = Pick<User, 'bait_name' | 'bait_item_id'>;
type UserTrinket = Pick<User, 'trinket_name' | 'trinket_item_id'>;
type UserViewingAttributes = Pick<User, 'viewing_atts'>;

export class UserBuilder {
    identification: UserIdentification = {
        user_id: 1,
        sn_user_id: '2',
        unique_hash: 'hashbrowns',
        has_shield: true,
    };

    turn: UserTurn = {
        num_active_turns: 0,
        next_activeturn_seconds: 0,
    };

    environment: UserEnvironment = {
        environment_id: 9999,
        environment_name: 'Test Environment',
    };

    trap: UserTrapStats = {
        trap_power: 9001,
        trap_luck: 42,
        trap_attraction_bonus: 0.05,
        trap_power_bonus: 0.01,
    };

    weapon: UserWeapon = {
        weapon_name: 'TestWeapon Trap',
        weapon_item_id: 1111,
    };

    base: UserBase = {
        base_name: 'TestBase Base',
        base_item_id: 2222,
    };

    bait: UserBait = {
        bait_name: 'TestBait Cheese',
        bait_item_id: 3333,
    };

    trinket: UserTrinket = {
        trinket_name: 'TestTrinket Charm',
        trinket_item_id: 4444,
    };

    quests: Quests = {
    };

    viewing_atts: UserViewingAttributes = {
        viewing_atts: {},
    };

    public withIdentification(id: UserIdentification) {
        this.identification = id;
        return this;
    }

    public withTurn(turn: UserTurn) {
        this.turn = turn;
        return this;
    }

    public withEnvironment(environment: UserEnvironment) {
        this.environment = environment;
        return this;
    }

    public withTrapStats(trap: UserTrapStats) {
        this.trap = trap;
        return this;
    }

    public withWeapon(weapon: UserWeapon) {
        this.weapon = weapon;
        return this;
    }

    public withBase(base: UserBase) {
        this.base = base;
        return this;
    }

    public withBait(bait: UserBait) {
        this.bait = bait;
        return this;
    }

    public withTrinket(trinket: UserTrinket) {
        this.trinket = trinket;
        return this;
    }

    public withQuests(quests: Quests) {
        this.quests = quests;
        return this;
    }

    public withViewingAttributes(viewing_atts: UserViewingAttributes) {
        this.viewing_atts = viewing_atts;
        return this;
    }

    public build(): User {
        return {
            ...clone(this.identification),
            ...clone(this.turn),
            ...clone(this.environment),
            ...clone(this.trap),
            ...clone(this.weapon),
            ...clone(this.base),
            ...clone(this.bait),
            ...clone(this.trinket),
            quests: clone(this.quests),
            ...clone(this.viewing_atts),
        };
    }
}

export class IntakeMessageBuilder {

    stage: unknown;

    withStage(stage: unknown) {
        this.stage = stage;
        return this;
    }

    public build(response: HgResponse): IntakeMessage {
        if (response.journal_markup == null) {
            throw new Error('Journal Markup cannot be empty');
        }

        const renderData = response.journal_markup[0].render_data;

        const message = {
            uuid: '1',
            extension_version: '0',
            hunter_id_hash: '01020304',
            entry_timestamp: renderData.entry_timestamp.toString(),
            location: {
                id: `${response.user.environment_id}`,
                name: `${response.user.environment_name}`,
            },
            shield: `${response.user.has_shield}`,
            total_power: `${response.user.trap_power}`,
            total_luck: `${response.user.trap_luck}`,
            attraction_bonus: `${response.user.trap_attraction_bonus * 100}`,
            trap: {
                id: `${response.user.weapon_item_id}`,
                name: `${response.user.weapon_name.replace(/ trap$/i, '')}`,
            },
            base: {
                id: `${response.user.base_item_id}`,
                name: `${response.user.base_name.replace(/ base$/i, '')}`,
            },
            cheese: {
                id: `${response.user.bait_item_id}`,
                name: `${response.user.bait_name.replace(/ cheese$/i, '')}`,
            },
            charm: {
                id: `${response.user.trinket_item_id}`,
                name: `${response.user.trinket_name?.replace(/ charm$/i, '')}`,
            },
            mouse: `${renderData.text.replace(/ mouse$/i, '')}`,
            // set these to static for now. May want to configure in future
            entry_id: '1',
            caught: '1',
            attracted: '1',
            hunt_details: {
                hunt_count: '1',
            },
        } as unknown as IntakeMessage;

        if (this.stage) {
            message.stage = this.stage;
        }

        return message;
    }
}
