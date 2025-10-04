import type { HttpRequestEventMap } from '@mswjs/interceptors';
import type { HgResponse } from '@scripts/types/hg';
import type { Listener } from 'strict-event-emitter';

import { BatchInterceptor, type ExtractEventNames } from '@mswjs/interceptors';
import { FetchInterceptor } from '@mswjs/interceptors/fetch';
import { XMLHttpRequestInterceptor } from '@mswjs/interceptors/XMLHttpRequest';
import nock from 'nock';

/**
 * Utility class to simplify mocking and watching http calls to
 * the hg and mhct servers.
 */
export default class MockServer {
    private readonly mswInterceptor = new BatchInterceptor({
        name: 'mhct-test-interceptor',
        interceptors: [
            new XMLHttpRequestInterceptor(),
            new FetchInterceptor(),
        ]
    });

    private mhctServer: nock.Scope;
    private hgServer: nock.Scope;
    private pageInterceptor?: nock.Interceptor;
    private activeTurnInterceptor?: nock.Interceptor;

    public get MhctServer(): nock.Scope {
        return this.mhctServer;
    }

    public get HitGrabServer(): nock.Scope {
        return this.hgServer;
    }

    constructor() {
        this.mswInterceptor.apply();
        this.hgServer = nock('https://www.mousehuntgame.com').defaultReplyHeaders({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        });

        // Extension version must be 0 in main.js for it to call localhost (see setupDOM() in e2eSetup.ts)
        this.mhctServer = nock('https://www.mhct.win').defaultReplyHeaders({
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
        });

        // Setup a few MHCT endpoints to reply happily! (200)
        this.mhctServer
            .persist()
            .post('/uuid.php')
            .reply(200, (uri, body) => {
                return '1';
            }, {'content-type': 'text/html'});

        this.mhctServer
            .persist()
            .post('/intake.php')
            .reply(200, (uri, body) => {
                return {
                    status: 'success',
                    message: 'Thanks for the hunt info!',
                };
            });

        this.mhctServer
            .persist()
            .post('/convertible_intake.php')
            .reply(200, (uri, body) => {
                return {
                    status: 'success',
                    message: 'Thanks for the convertible info!',
                };
            });
    }

    /**
     * Wait for a specific request to be made to the mock server
     * @param event The type of event to listen for (request or response)
     * @param url The full url to listen for
     * @param timeout How long to wait before rejecting the promise (default 5000ms)
     * @returns A promise that resolves when the request is made, or rejects on timeout
     */
    async on<EventName extends ExtractEventNames<HttpRequestEventMap>>(
        event: EventName,
        url: string,
        timeout = 5000) {
        let timer: NodeJS.Timeout | undefined;
        return Promise.race([
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event} ${url}`)), timeout);
            }),
            new Promise<HttpRequestEventMap[EventName][0]>((resolve) => {
                const handler: Listener<HttpRequestEventMap[EventName]> = (args) => {
                    if (args.request.url === url) {
                        this.mswInterceptor.off(event, handler);
                        clearTimeout(timer);
                        resolve(args);
                    }
                };

                this.mswInterceptor.on(event, handler);
            })
        ]);
    }

    /**
     * Utility method to set data returned from page.php
     * @param response The data to be returned from page.php
     */
    setPageResponse(response: HgResponse) {
        if (this.pageInterceptor != null) {
            nock.removeInterceptor(this.pageInterceptor);
        }

        this.pageInterceptor = this.hgServer.post(
            '/managers/ajax/pages/page.php'
        );
        this.pageInterceptor.reply(200, () => response);
    }

    /**
     * Utility method to set data returned from activeturn.php
     * @param response The data to be returned from activeturn.php
     */
    setActiveTurnResponse(response: HgResponse) {
        if (this.activeTurnInterceptor != null) {
            nock.removeInterceptor(this.activeTurnInterceptor);
        }

        this.activeTurnInterceptor = this.hgServer.post(
            '/managers/ajax/turns/activeturn.php'
        );
        this.activeTurnInterceptor.reply(200, (uri, body) => {
            return response;
        });
    }
}
