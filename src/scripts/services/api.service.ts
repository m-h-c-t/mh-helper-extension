import {param} from '@scripts/util/param';

export class ApiService {
    async send(method: 'POST', url: string, body: unknown): Promise<Response> {
        return await fetch(new Request(
            url,
            {
                method: method,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: param(body),
            }
        ));
    }
}
