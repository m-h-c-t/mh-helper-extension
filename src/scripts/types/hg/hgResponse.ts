import {InventoryItem} from "./inventoryItem";
import {JournalMarkup} from "./journalMarkup";
import {User} from './user';


export interface HgResponse {
    user: User;
    page?: unknown;
    success: 0 | 1;
    active_turn?: boolean;
    journal_markup?: JournalMarkup[];
    inventory?: Record<string, InventoryItem> | [];
}
