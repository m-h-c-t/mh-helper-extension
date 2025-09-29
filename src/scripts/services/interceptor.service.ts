/* eslint-disable @typescript-eslint/no-misused-promises */ // mswjs correctly handles promise listeners internally
import {BatchInterceptor, type ExtractEventNames} from '@mswjs/interceptors';
import {XMLHttpRequestInterceptor} from '@mswjs/interceptors/XMLHttpRequest';
import {FetchInterceptor} from '@mswjs/interceptors/fetch';
import {hgResponseSchema, type HgResponse} from '@scripts/types/hg';
import {Emitter} from 'strict-event-emitter';
import {LoggerService} from './logging';
import qs from 'qs';
import z from 'zod';

export interface RequestEventParams {
    url: URL;
    requestId: string;
    request: RequestBody;
}

export interface ResponseEventParams extends RequestEventParams {
    response: HgResponse;
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type InterceptorEventMap = {
    request: [
        args: RequestEventParams
    ],
    response: [
        args: ResponseEventParams
    ],
}

export interface RequestBody {
    [key: string]: undefined | string | RequestBody | (string | RequestBody)[];
}

type PromiseLikeListener<Data extends unknown[]> = (...data: Data) => void | Promise<void>;

/**
 * Service for intercepting HTTP requests and responses from MouseHunt game endpoints.
 *
 * This service uses the MSW (Mock Service Worker) interceptor to monitor XMLHttpRequest
 * and Fetch API calls, specifically targeting MouseHunt game AJAX endpoints. It validates
 * requests and responses, parses the data, and emits events for consumption by other
 * parts of the application.
 */
export class InterceptorService {
    private readonly interceptor = new BatchInterceptor({
        name: 'mhct-interceptor',
        interceptors: [
            new XMLHttpRequestInterceptor(),
            new FetchInterceptor(),
        ]
    });
    private emitter: Emitter<InterceptorEventMap>;

    constructor(private readonly logger: LoggerService) {
        this.emitter = new Emitter<InterceptorEventMap>();

        this.interceptor.on('request', async ({request, requestId}) => await this.processRequest(request, requestId));
        this.interceptor.on('response', ({response, request, requestId}) => void this.processResponse(response, request, requestId));

        this.interceptor.apply();
    }

    on<EventName extends ExtractEventNames<InterceptorEventMap>>(
        eventName: EventName,
        listener: PromiseLikeListener<InterceptorEventMap[EventName]>,
    ): this {
        this.emitter.on(eventName, listener);
        return this;
    }

    once<EventName extends ExtractEventNames<InterceptorEventMap>>(
        eventName: EventName,
        listener: PromiseLikeListener<InterceptorEventMap[EventName]>,
    ): this {
        this.emitter.once(eventName, listener);
        return this;
    }

    off<EventName extends ExtractEventNames<InterceptorEventMap>>(
        eventName: EventName,
        listener: PromiseLikeListener<InterceptorEventMap[EventName]>,
    ): this {
        this.emitter.off(eventName, listener);
        return this;
    }

    private async emitAsync<
        EventName extends keyof InterceptorEventMap,
    >(
        eventName: EventName,
        ...data: InterceptorEventMap[EventName]
    ): Promise<void> {
        const listeners = this.emitter.listeners(eventName);

        if (listeners.length === 0) {
            return;
        }

        for (const listener of listeners) {
            // eslint-disable-next-line @typescript-eslint/await-thenable
            await listener.apply(this.emitter, data);
        }
    }

    private async processRequest(request: Request, requestId: string): Promise<void> {
        if (!this.isSupportedRequest(request)) {
            return;
        }

        const body = qs.parse(await request.clone().text());

        this.logger.debug(`Interceptor emitting request`, {
            id: requestId,
            url: new URL(request.url).pathname,
            request: body,
        });

        const eventData: RequestEventParams = {
            url: new URL(request.url),
            requestId: requestId,
            request: body,
        };

        await this.emitAsync('request', eventData);
    }

    private async processResponse(response: Response, request: Request, requestId: string) {
        if (!this.isSupportedRequest(request) || !this.isSupportedResponse(response)) {
            return;
        }
        const responseClone = response.clone();
        const responseParseResult = hgResponseSchema.safeParse(await responseClone.json());
        if (!responseParseResult.success) {
            this.logger.warn(`Interceptor encountered unexpected HG response\n\n ${z.prettifyError(responseParseResult.error)}`, {
                url: response.url,
                response: responseParseResult
            });

            return;
        }

        const requestBody = qs.parse(await request.clone().text());

        this.logger.debug(`Interceptor emitting response`, {
            id: requestId,
            url: new URL(response.url).pathname,
            request: requestBody,
            response: responseParseResult.data,
        });

        const eventData: ResponseEventParams = {
            url: new URL(response.url),
            requestId: requestId,
            request: requestBody,
            response: responseParseResult.data,
        };

        await this.emitAsync('response', eventData);
    }

    private isSupportedRequest(request: Request): boolean {
        if (!this.isSupportedUrl(request.url)) {
            return false;
        }

        const contentType = request.headers.get('content-type') ?? '';
        if (!contentType.includes('application/x-www-form-urlencoded')) {
            return false;
        }

        return true;
    }

    private isSupportedResponse(response: Response): boolean {
        if (!this.isSupportedUrl(response.url)) {
            return false;
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json') || contentType.includes('text/javascript')) {
            return true;
        }

        return false;
    }

    private isSupportedUrl(url: string): boolean {
        const parsedUrl = new URL(url);

        return parsedUrl.origin === 'https://www.mousehuntgame.com'
            // TODO: Enable when hunter_hash is supported
            //&& !parsedUrl.pathname.endsWith('/managers/ajax/users/session.php') // Ignore sensitive session calls
            && !parsedUrl.pathname.startsWith('/api/'); // Ignore mobile API calls
    }
}
