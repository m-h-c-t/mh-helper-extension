/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Computes the differences between two objects and stores the results.
 * Ignores keys ending with 'hash'.
 *
 * @param result - Object to store computed differences
 * @param before - The pre-comparison object
 * @param after - The post-comparison object
 * @returns The result object with computed differences
 */
export function diffObject(
    result: Record<string, any>,
    before: Record<string, any>,
    after: Record<string, any>
): Record<string, any> {
    const beforeKeys = new Set<string>();
    const afterKeys = new Set<string>(Object.keys(after));
    // Process keys from pre object
    processOldKeys(result, beforeKeys, afterKeys, before, after);

    // Process keys that only exist in post object
    processNewKeys(result, beforeKeys, after);

    return result;
}

function shouldIgnoreKey(key: string): boolean {
    return key.endsWith('hash');
}

function isPrimitive(value: any): boolean {
    const type = typeof value;
    return type === 'string' || type === 'number' || type === 'boolean';
}

function areBothObjects(value1: any, value2: any): boolean {
    return value1 !== null && typeof value1 === 'object'
        && value2 !== null && typeof value2 === 'object';
}

/**
 * Process keys from the pre object and compare with post object
 */
function processOldKeys(
    result: Record<string, any>,
    pre: Set<string>,
    post: Set<string>,
    before: Record<string, any>,
    after: Record<string, any>
): void {
    for (const [key, preValue] of Object.entries(before)) {
        if (shouldIgnoreKey(key)) continue;

        pre.add(key);

        if (!post.has(key)) {
            result[key] = {in: 'pre', val: preValue};
            continue;
        }

        const postValue = after[key];

        if (isPrimitive(preValue)) {
            handlePrimitiveDiff(result, key, preValue, postValue);
        } else if (Array.isArray(preValue) && Array.isArray(postValue)) {
            handleArrayDiff(result, key, preValue, postValue);
        } else if (areBothObjects(preValue, postValue)) {
            handleObjectDiff(result, key, preValue, postValue);
        }
    }
}

function processNewKeys(
    result: Record<string, any>,
    preKeys: Set<string>,
    after: Record<string, any>
): void {
    for (const key of Object.keys(after)) {
        if (shouldIgnoreKey(key)) continue;

        if (!preKeys.has(key)) {
            result[key] = {in: 'post', val: after[key]};
        }
    }
}

/**
 * Handle differences between primitive values
 */
function handlePrimitiveDiff(
    result: Record<string, any>,
    key: string,
    preValue: any,
    postValue: any
): void {
    // Use loose equality to handle numeric string comparisons
    if (preValue != postValue) {
        result[key] = {pre: preValue, post: postValue};
    }
}

/**
 * Handle differences between arrays
 */
function handleArrayDiff(
    result: Record<string, any>,
    key: string,
    preArray: any[],
    postArray: any[]
): void {
    if (preArray.length !== postArray.length) {
        const type = preArray.length > postArray.length ? '-' : '+';
        result[key] = {type, pre: preArray, post: postArray};
        return;
    }

    // Compare element-wise
    const elementDiffs = compareArrayElements(preArray, postArray);

    if (Object.keys(elementDiffs).length > 0) {
        result[key] = elementDiffs;
    }
}

/**
 * Compare array elements and return differences
 */
function compareArrayElements(preArray: any[], postArray: any[]): Record<string, any> {
    const diffs: Record<string, any> = {};

    for (let i = 0; i < preArray.length; i++) {
        const preElement = preArray[i];
        const postElement = postArray[i];

        if (areBothObjects(preElement, postElement)) {
            const elementDiff: Record<string, any> = {};
            diffObject(elementDiff, preElement, postElement);

            if (Object.keys(elementDiff).length > 0) {
                diffs[i] = elementDiff;
            }
        } else if (preElement !== postElement) {
            diffs[i] = {pre: preElement, post: postElement};
        }
    }

    return diffs;
}

/**
 * Handle differences between objects
 */
function handleObjectDiff(
    result: Record<string, any>,
    key: string,
    preObject: Record<string, any>,
    postObject: Record<string, any>
): void {
    const objectDiff: Record<string, any> = {};
    diffObject(objectDiff, preObject, postObject);

    if (Object.keys(objectDiff).length > 0) {
        result[key] = objectDiff;
    }
}
