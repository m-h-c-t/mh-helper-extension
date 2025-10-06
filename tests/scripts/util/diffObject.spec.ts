/* eslint-disable @typescript-eslint/no-explicit-any */
import { diffObject } from '@scripts/util/diffObject';

describe('diffObject', () => {
    it('should detect primitive differences', () => {
        const pre = {a: 1, b: 'foo', c: true};
        const post = {a: 2, b: 'foo', c: false};
        const result: Record<string, any> = {};
        diffObject(result, pre, post);
        expect(result).toEqual({
            a: {pre: 1, post: 2},
            c: {pre: true, post: false}
        });
    });

    it('should detect missing keys', () => {
        const pre = {a: 1, b: 2};
        const post = {a: 1};
        const result: Record<string, any> = {};
        diffObject(result, pre, post);
        expect(result).toEqual({
            b: {in: 'pre', val: 2}
        });
    });

    it('should detect added keys', () => {
        const pre = {a: 1};
        const post = {a: 1, b: 2};
        const result: Record<string, any> = {};
        diffObject(result, pre, post);
        expect(result).toEqual({
            b: {in: 'post', val: 2}
        });
    });

    it('should compare arrays by length and content', () => {
        const pre = {arr: [1, 2, 3]};
        const post = {arr: [1, 2, 4]};
        const result: Record<string, any> = {};
        diffObject(result, pre, post);
        expect(result).toEqual({
            arr: {
                2: {pre: 3, post: 4}
            }
        });
    });

    it('should detect arrays with more elements in pre', () => {
        const pre = {arr: [1, 2, 3, 4]};
        const post = {arr: [1, 2, 3]};
        const result: Record<string, any> = {};
        diffObject(result, pre, post);
        expect(result).toEqual({
            arr: {type: '-', pre: [1, 2, 3, 4], post: [1, 2, 3]}
        });
    });

    it('should detect arrays with more elements in post', () => {
        const pre = {arr: [1, 2, 3]};
        const post = {arr: [1, 2, 3, 4]};
        const result: Record<string, any> = {};
        diffObject(result, pre, post);
        expect(result).toEqual({
            arr: {type: '+', pre: [1, 2, 3], post: [1, 2, 3, 4]}
        });
    });

    it('should recurse into nested arrays', () => {
        const pre = {arr: [[1, 2], [3, 4]]};
        const post = {arr: [[1, 2], [3, 5]]};
        const result: Record<string, any> = {};
        diffObject(result, pre, post);
        expect(result).toEqual({
            arr: {
                1: {
                    1: {pre: 4, post: 5}
                }
            }
        });
    });

    it('should recurse into nested objects with arrays', () => {
        const pre = {obj: {arr: [1, 2, 3]}};
        const post = {obj: {arr: [1, 2, 4]}};
        const result: Record<string, any> = {};
        diffObject(result, pre, post);
        expect(result).toEqual({
            obj: {
                arr: {
                    2: {pre: 3, post: 4}
                }
            }
        });
    });

    it('should recurse into nested objects', () => {
        const pre = {obj: {x: 1, y: 2}};
        const post = {obj: {x: 1, y: 3}};
        const result: Record<string, any> = {};
        diffObject(result, pre, post);
        expect(result).toEqual({
            obj: {y: {pre: 2, post: 3}}
        });
    });

    it('should ignore keys ending with hash', () => {
        const pre = {a: 1, b_hash: 2};
        const post = {a: 1, b_hash: 3};
        const result: Record<string, any> = {};
        diffObject(result, pre, post);
        expect(result).toEqual({});
    });
});
