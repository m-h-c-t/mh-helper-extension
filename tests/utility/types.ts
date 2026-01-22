/**
 * Recursively transforms all properties of a type to strings, while preserving object structure.
 *
 * Example:
 * interface TestType {
 *     one: number,
 *     foo: boolean,
 *     obj?: {
 *         two: number
 *     },
 *     arr: boolean[] | undefined
 * }
 *
 * StringyObject<TestType> would be equivalent to:
 * interface TestType {
 *     one: string,
 *     foo: string,
 *     obj?: {
 *         two: string
 *     },
 *     arr: string[] | undefined
 * }
 */
export type StringyObject<T> = {
    [K in keyof T]: T[K] extends []
        ? string[]
        : NonNullable<T[K]> extends object
            ? T[K] extends object
                ? StringyObject<T[K]>
                : StringyObject<NonNullable<T[K]>> | Extract<T[K], null | undefined>
            : string;
};

export type RecursivePartial<T> = {
    [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
        T[P] extends object | undefined ? RecursivePartial<T[P]> :
            T[P];
};
