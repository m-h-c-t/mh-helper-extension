import type { EnvironmentService } from '@scripts/services/environment.service';
import type { LoggerService } from '@scripts/services/logging';

import { BrowserApi } from '@scripts/services/browser/browser-api';
import { fromChromeEvent } from '@scripts/services/browser/from-chrome-event';
import fuzzysort from 'fuzzysort';
import { debounceTime } from 'rxjs/operators';
import { LRU } from 'tiny-lru';
import z from 'zod';

export class OmniboxBackground {
    private readonly mhctCache = new MhctCache();
    private readonly itemTypePrefixMap: Record<ItemType, {
        prefix: string;
        description: string;
    }> = {
        mouse: {
            prefix: 'ar',
            description: 'Attraction Rate: Search by mouse name to see the location, cheese and attraction rate of a specific mouse.'
        },
        loot: {
            prefix: 'l',
            description: 'Looter: Search by loot name to see the location and drop rate of a specific loot.'
        },
        map: {
            prefix: 'm',
            description: 'Mapper: Search maps to see what mice are likely to appear on them.'
        },
        mousemaps: {
            prefix: 'rm',
            description: 'Reverse Mapper: Search for a mouse to see which maps it\'s likely to appear on.'
        },
        convertible: {
            prefix: 'c',
            description: 'Converter: Search convertibles like chests, to see what items are likely to be in them.'
        },
        itemconvertibles: {
            prefix: 'rc',
            description: 'Reverse Converter: Search to see which convertibles are likely to have the item you are looking for.'
        },
    };

    constructor(private readonly logger: LoggerService,
        private readonly environmentService: EnvironmentService
    ) {
    }

    async init() {
        await this.initializeExtensionListeners();
    }

    private async initializeExtensionListeners() {
        BrowserApi.addListener(chrome.omnibox.onInputStarted, this.onInputStartedOrCancelled);
        fromChromeEvent(chrome.omnibox.onInputChanged)
            .pipe(
                debounceTime(250),
            )
            .subscribe(([text, suggest]) => {
                void this.onInputChanged(text, suggest);
            });
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        BrowserApi.addListener(chrome.omnibox.onInputEntered, this.onInputEntered);
        BrowserApi.addListener(chrome.omnibox.onInputCancelled, this.onInputStartedOrCancelled);

        await chrome.omnibox.setDefaultSuggestion({
            description: 'MHCT Search - Prefix with "ar", "l", "m", "rm", "c", or "rc" to specify type.'});
    }

    private onInputChanged = async (text: string, suggest: (suggestions: chrome.omnibox.SuggestResult[]) => void) => {
        this.logger.debug(`✏️ onInputChanged: ${text}`);

        const match = /^(?<prefix>\w+):?\s*(?<query>.*)/.exec(text);

        let prefix: string;
        let query: string;

        if (!match) {
            // No structured prefix/query match; treat the whole input as a query with the default prefix.
            prefix = 'ar';
            query = text;
        } else {
            prefix = match.groups?.prefix ?? 'ar';
            query = match.groups?.query ?? '';
        }

        let itemType = this.getItemTypeFromQuery(prefix);

        if (!itemType) {
            // Unrecognized prefix: fall back to the default prefix and treat the entire input as the query.
            prefix = this.itemTypePrefixMap.mouse.prefix;
            query = text;
            itemType = this.getItemTypeFromQuery(prefix);
        }

        if (!itemType) {
            return;
        }

        await chrome.omnibox.setDefaultSuggestion({
            description: this.itemTypePrefixMap[itemType]?.description || 'MHCT Search - Prefix with "ar", "l", "m", "rm", "c", or "rc" to specify type.'
        });

        await this.provideItemSuggestions(itemType, query, suggest);
    };

    private onInputEntered = async (text: string, disposition: browser.omnibox.OnInputEnteredDisposition) => {
        this.logger.debug(`✔️ onInputEntered: text -> ${text} | disposition -> ${disposition}`);

        const match = /^(?<prefix>\w+):?\s*(?<query>.*)/.exec(text);

        const prefix = match?.groups?.prefix ?? 'ar';
        const query = match?.groups?.query ?? '';

        const itemType = this.getItemTypeFromQuery(prefix);
        if (!itemType) {
            return;
        }

        const items = await this.getAllItems(itemType);
        if (!items) {
            this.logger.error(`No cached items found for type ${itemType}`);
            return;
        }

        const topItem = fuzzysort.go(query, items, {key: 'value'});
        if (topItem.length == 0) {
            this.logger.error(`No matching item found for query "${text}"`);
            return;
        }
        const itemId = topItem[0].obj.id;

        let path = '';
        switch (itemType) {
            case 'mouse':
                path = `/attractions.php?mouse=${itemId}&timefilter=all_time`;
                break;
            case 'loot':
                path = `/loot.php?item=${itemId}&timefilter=all_time`;
                break;
            case 'map':
                path = `/mapper.php?item=${itemId}`;
                break;
            case 'mousemaps':
                path = `/reverse-mapper.php?item=${itemId}`;
                break;
            case 'convertible':
                path = `/converter.php?item=${itemId}`;
                break;
            case 'itemconvertibles':
                path = `/reverse-converter.php?item=${itemId}`;
                break;
            default:
                break;
        }

        const url = `${this.environmentService.getBaseUrl()}${path}`;
        switch (disposition) {
            case 'currentTab':
                void chrome.tabs.update({url: url});
                break;
            case 'newForegroundTab':
                void chrome.tabs.create({url: url});
                break;
            case 'newBackgroundTab':
                void chrome.tabs.create({url: url, active: false});
                break;
        }
    };

    private onInputStartedOrCancelled = () => {
        void chrome.omnibox.setDefaultSuggestion({
            description: 'MHCT Search - Prefix with "ar", "l", "m", "rm", "c", or "rc" to specify type.'});
    };

    private async provideItemSuggestions(itemType: ItemType, query: string, suggest: (suggestions: chrome.omnibox.SuggestResult[]) => void) {
        const items = await this.getAllItems(itemType);
        const prefix = this.itemTypePrefixMap[itemType]?.prefix ?? 'ar';
        this.provideSuggestions(query, prefix, items, suggest);
    }

    private provideSuggestions(query: string, prefix: string, items: MhctItem[], suggest: (suggestions: chrome.omnibox.SuggestResult[]) => void) {
        let topResults: MhctItem[] = [];
        if (query.length === 0) {
            topResults = items.slice(0, 5);
        } else {
            const result = fuzzysort.go(query, items, {key: 'value'});
            topResults = result.slice(0, 5).map(r => r.obj);
        }
        const suggestions = topResults.map(item => ({
            content: `${prefix} ${item.value}`,
            description: `${item.value}`,
        }));

        suggest(suggestions);
    }

    private async getAllItems(itemType: ItemType) {
        const cached = this.mhctCache.get(itemType);
        if (cached) {
            return cached;
        }

        // fetch using URLSearchParams to encode query params
        const params = new URLSearchParams({
            item_type: itemType,
            item_id: 'all',
        });
        const url = `${this.environmentService.getBaseUrl()}/searchByItem.php?${params.toString()}`;
        let response;
        try {
            response = await fetch(url);
        } catch {
            this.logger.warn(`Failed to fetch items for type ${itemType} from MHCT API`);
            return [];
        }

        if (!response.ok) {
            this.logger.error(`Failed to search for ${itemType}: ${response.status} ${response.statusText}`);
            return [];
        }

        const parseResult = await mhctGetItemSchema.array().safeParseAsync(await response.json());
        if (!parseResult.success) {
            this.logger.error(`Failed to parse ${itemType} search results: ${parseResult.error}`);
            return [];
        }

        this.mhctCache.set(itemType, parseResult.data);

        return parseResult.data;
    }

    private getItemTypeFromQuery(prefix: string): ItemType {
        const prefixAliases: {type: ItemType, aliases: string[]}[] = [
            {type: 'mouse', aliases: ['ar', 'attraction', 'attractions']},
            {type: 'loot', aliases: ['l', 'loot']},
            {type: 'map', aliases: ['m', 'map']},
            {type: 'mousemaps', aliases: ['rm', 'rmap']},
            {type: 'convertible', aliases: ['c', 'conv', 'converter']},
            {type: 'itemconvertibles', aliases: ['rc', 'rconv', 'rconverter']},
        ];

        // Flatten all aliases into searchable array
        const searchableAliases = prefixAliases.flatMap(({type, aliases}) =>
            aliases.map(alias => ({alias, type}))
        );

        const result = fuzzysort.go(prefix, searchableAliases, {key: 'alias', limit: 1});

        return result.length > 0 ? result[0].obj.type : 'mouse';
    }
}

type ItemType = 'mouse' | 'loot' | 'map' | 'mousemaps' | 'convertible' | 'itemconvertibles';
const mhctGetItemSchema = z.object({
    id: z.number(),
    value: z.string()
});
type MhctItem = z.infer<typeof mhctGetItemSchema>;

class MhctCache extends LRU<MhctItem[]> {
    constructor() {
        super(10, 5 * 60 * 1000, true); // 10 items, 5 minutes TTL
    }
}
