import {param} from "@scripts/util/param";

export class ApiService {
    /**
     * Sends an HTTP request to the specified URL.
     *
     * @param method - The HTTP method to use ('GET' or 'POST')
     * @param url - The target URL for the request
     * @param body - The request body data (will be processed according to its type)
     * @param hasResponse - Indicates whether a response body is expected
     * @param alterHeaders - Optional callback to modify request headers before sending
     *
     * @returns A Promise resolving to the response data (JSON or text based on Content-Type)
     * or rejecting with an error if the request fails
     *
     * @throws Error if the response status is not 200 or 204
     *
     * @remarks
     * - For string bodies, Content-Type is set to application/json
     * - For object bodies, they are converted to URL-encoded format
     * - If hasResponse is true, sets Accept header to application/json
     */
    async send(method: 'GET' | 'POST', url: string, body: unknown, hasResponse: boolean, alterHeaders?: (headers: Headers) => void): Promise<unknown> {
        const headers = new Headers();
        if (hasResponse) {
            headers.append('Accept', 'application/json');
        }

        if (alterHeaders != null) {
            alterHeaders(headers);
        }

        let requestBody: BodyInit | null | undefined = null;
        if (body != null) {
            if (typeof body === 'string') {
                headers.set('Content-Type', 'application/json; charset=utf-8');
                requestBody = body;
            } else if (typeof body === 'object') {
                headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');
                requestBody = param(body);
            }
        }

        const requestInit: RequestInit = {
            method: method,
            headers: headers,
            body: requestBody,
        };

        const response = await fetch(new Request(url, requestInit));
        if (hasResponse && response.status === 200) {
            const data = await response.text();
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        } else if (response.status !== 200 && response.status !== 204) {
            return Promise.reject(new Error(`Request failed with status ${response.status}: ${response.statusText}`));
        }
    }
}
