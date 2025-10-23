import type { HgConvertibleResponse, HgResponse, InventoryItem, JournalMarkup, Quests, User } from '@scripts/types/hg';
import type { ConvertibleOpen } from '@scripts/types/hg/convertibleOpen';
import type { ConvertibleMessage, IntakeMessage, Loot } from '@scripts/types/mhct';

import type { StringyObject } from './stringyObject';

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
    trapImage?: {auras: Record<string, {status: 'active' | 'hidden'}>};
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
                mouse_type: '',
                css_class: '',
                entry_date: '',
                environment: '',
                entry_timestamp: 0,
                text: ''
            }
        }];

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

export class HgConvertibleResponseBuilder extends HgResponseBuilder {
    convertibleOpen?: ConvertibleOpen;
    items?: Record<string, InventoryItem>;

    withConvertible(args: {
        convertible: InventoryItem;
        items: (InventoryItem & {pluralized_name?: string})[];
    }) {
        const convertible = clone(args.convertible);
        const items = clone(args.items);

        this.convertibleOpen = {
            ...convertible,
            items: items.map((v, i) => ({
                type: v.type,
                name: v.name,
                pluralized_name: v.pluralized_name,
                quantity: v.quantity,
            }))
        };
        this.items = {
            [convertible.type]: convertible,
        };
        this.inventory = {
            [convertible.type]: convertible,
            ...items.reduce((acc, cur) => {
                delete cur.pluralized_name;
                acc[cur.type] = cur;
                return acc;
            }, {} as Record<string, InventoryItem>),
        };

        return this;
    }

    override build(): HgConvertibleResponse {
        const base = super.build();

        if (this.convertibleOpen == null) {
            throw new Error('ConvertibleOpen must be set');
        }

        if (this.items == null) {
            throw new Error('Items must be set');
        }

        return {
            ...base,
            convertible_open: this.convertibleOpen,
            items: this.items,
        };
    }
}

type UserIdentification = Pick<User, 'user_id' | 'sn_user_id' | 'unique_hash' | 'has_shield' | 'has_puzzle'>;
type UserTurn = Pick<User, 'num_active_turns' | 'next_activeturn_seconds' | 'last_active_turn_timestamp' | 'activeturn_wait_seconds'>;
type UserEnvironment = Pick<User, 'environment_id' | 'environment_name'>;
type UserTrapStats = Pick<User, 'trap_power' | 'trap_luck' | 'trap_attraction_bonus' | 'trap_power_bonus'>;
type UserWeapon = Pick<User, 'weapon_name' | 'weapon_item_id'>;
type UserBase = Pick<User, 'base_name' | 'base_item_id'>;
type UserBait = Pick<User, 'bait_name' | 'bait_item_id'>;
type UserTrinket = Pick<User, 'trinket_name' | 'trinket_item_id'>;
type UserViewingAttributes = Pick<User, 'viewing_atts'>;

export class UserBuilder {
    identification: UserIdentification = {
        user_id: 1,
        sn_user_id: '2',
        // sha512 of user_id: 1
        unique_hash: '4dff4ea340f0a823f15d3f4f01ab62eae0e5da579ccb851f8db9dfe84c58b2b37b89903a740e1ee172da793a6e79d560e5f7f9bd058a12a280433ed6fa46510a',
        has_shield: true,
        has_puzzle: false,
    };

    turn: UserTurn = {
        num_active_turns: 0,
        next_activeturn_seconds: 0,
        last_active_turn_timestamp: 0,
        activeturn_wait_seconds: 900,
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
    auras?: string[];
    loot?: Loot[];
    stage: unknown;

    withAuras(auras: string[]) {
        this.auras = auras;
        return this;
    }

    withLoot(loot: Loot[]) {
        this.loot = loot;
        return this;
    }

    withStage(stage: unknown) {
        this.stage = stage;
        return this;
    }

    public build(response: HgResponse): IntakeMessage {
        if (response.journal_markup == null) {
            throw new Error('Journal Markup cannot be empty');
        }

        const renderData = response.journal_markup[0].render_data;

        const message: Partial<StringyObject<IntakeMessage>> & Record<string, unknown> = {
            uuid: '1',
            extension_version: '0',
            hunter_id_hash: '4dff4ea340f0a823f15d3f4f01ab62eae0e5da579ccb851f8db9dfe84c58b2b37b89903a740e1ee172da793a6e79d560e5f7f9bd058a12a280433ed6fa46510a',
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
                is_lucky_catch: 'false'
            },
        };

        if (this.auras) {
            message.auras = this.auras;
        }

        if (this.loot) {
            message.loot = this.loot.map(v => ({
                id: `${v.id}`,
                name: v.name,
                amount: `${v.amount}`,
                lucky: `${v.lucky}`,
                plural_name: v.plural_name,
            }));
        }

        if (this.stage) {
            message.stage = this.stage;
        }

        // @ts-expect-error - Partial<StringyObject<IntakeMessage>> is not exactly IntakeMessage
        return message;
    }
}

export class ConvertibleMessageBuilder {
    public build(response: HgConvertibleResponse): ConvertibleMessage {
        const convertibleItem = response.items[response.convertible_open!.type];

        if (convertibleItem == null) {
            throw new Error();
        }

        const message: Partial<StringyObject<ConvertibleMessage>> & Record<string, unknown> = {
            convertible: {
                id: `${convertibleItem.item_id}`,
                name: `${convertibleItem.name}`,
                quantity: `${convertibleItem.quantity}`,
            },
            items: response.convertible_open!.items.map((v) => {
                return {
                    // @ts-expect-error - response.items[v.type] may be undefined
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    id: `${response.inventory[v.type].item_id}`,
                    name: v.name,
                    quantity: `${v.quantity}`,
                };
            }),
            uuid: '1',
            entry_timestamp: '1212121',
            asset_package_hash: '1212121000',
            extension_version: '0',
            hunter_id_hash: '4dff4ea340f0a823f15d3f4f01ab62eae0e5da579ccb851f8db9dfe84c58b2b37b89903a740e1ee172da793a6e79d560e5f7f9bd058a12a280433ed6fa46510a',
        };

        // @ts-expect-error - Partial<StringyObject<ConvertibleMessage>> is not exactly ConvertibleMessage
        return message;
    }
}
