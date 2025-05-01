/* Emulates jquery.param() */
export function param(data: unknown) {
    if (data == null) { return ""; }

    const urlParams: string[] = [];

    const add = (name: string, valueOrFunction: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        let value: unknown = typeof valueOrFunction === "function" ? valueOrFunction() : valueOrFunction;
        value ??= "";

        urlParams.push(`${encodeURIComponent(name)}=${encodeURIComponent(value as (string | number | boolean))}`);
    };

    const buildParams = (prefix: string, obj: unknown) => {
        if (Array.isArray(obj)) {
            obj.forEach((value, index) => {
                if (prefix.endsWith("[]")) {
                    add(prefix, value);
                } else {
                    const i = typeof value === "object" && value != null ? index : "";
                    buildParams(`${prefix}[${i}]`, value);
                }
            });
        } else if (typeof obj === "object" && obj != null) {
            for (const [name, value] of Object.entries(obj)) {
                buildParams(`${prefix}[${name}]`, value);
            }
        } else {
            add(prefix, obj);
        }
    };

    if (Array.isArray(data)) {
        // If an array was passed in,
        // assume that it is a collection of form elements:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        data.forEach(el => add(el.name, el.value));
    } else {
        for (const [name, value] of Object.entries(data)) {
            buildParams(name, value);
        }
    }

    return urlParams.join("&");
};
