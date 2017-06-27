import * as deep from './deep';

import { expect } from 'chai';

type EmptyBase = {
    undefined: undefined;
    null: null;
    string: string;
    array: any[];
    object: object;
};

const base: EmptyBase = {
    undefined: undefined,
    null: null,
    string: '',
    array: [],
    object: {}
};

describe('Deep Functions', () => {

    describe("- empty", () => {
        it('should match `undefined`', () => expect(deep.empty(undefined)).true);
        it('should match `null`', () => expect(deep.empty(null)).true);
        it('should match an empty string `\'\'`', () => expect(deep.empty('')).true);
        it('should match a zero-length array `[]`', () => expect(deep.empty([])).true);
        it('should match a zero property object `{}`', () => expect(deep.empty({})).true);
        it('should not match `false`', () => expect(deep.empty(false)).false);
        it('should not match `true`', () => expect(deep.empty(true)).false);
        it('should not match `42`', () => expect(deep.empty(42)).false);
        it('should not match `"Hello"`', () => expect(deep.empty("Hello")).false);
        it('should match `[null]', () => expect(deep.empty([null])).true);
        it('should match `[undefined]', () => expect(deep.empty([undefined])).true);
        it('should match `[""]`', () => () => expect(deep.empty([''])).true);
        it('should not match `[true]`', () => () => expect(deep.empty([true])).false);
        it('should match an array containing only an zero-length array `[[]]`', () => () => expect(deep.empty([[]])).true);
        it('should match an array containing only a zero-length object `[{}]`', () => () => expect(deep.empty([{}])).true);
        it('should match an array with only empty values', () => () => 
            expect(deep.empty([undefined, null, '', [], {}])).true);
        it('should match an object with only empty properties', () =>
            expect(deep.empty(base)).true);

        it('should match any assembly of empty values', () => {
            expect(deep.empty({
                ...base,
                array2: [undefined, null, '', [], {}],
                object2: {
                    ...base,
                    array3: [undefined, null, '', [], {}],
                    object3: base
                }
            })).true
        });
        it('should not match any assembly of empty values with one non-empty', () => {
            expect(deep.empty({
                ...base,
                array2: [undefined, null, '', [], {}],
                object2: {
                    ...base,
                    array3: [undefined, null, '', [], {}, "a"],
                    object3: base
                }
            })).false
        });
    });

    describe(' - equal', () => {
        it('should match two `undefined`', () => {
            expect(deep.equal(undefined, undefined)).true;
        });

        it('should match two `null`', () => {
            expect(deep.equal(null, null)).true;
        });

        it('should match two same booleans', () => {
            expect(deep.equal(true, true)).true;
            expect(deep.equal(false, false)).true;
            expect(deep.equal(true, false)).false;
            expect(deep.equal(false, true)).false;
        });

        it('should match two same numbers', () => {
            expect(deep.equal(42, 42)).true;
            expect(deep.equal(41, 42)).false;
            expect(deep.equal(42, 3.14)).false;
        });

        it('should match two same strings', () => {
            expect(deep.equal("Hello", "Hello")).true;
            expect(deep.equal("Hello", "")).false;
            expect(deep.equal("Hello", "Goodbye")).false;
        });

        it('should match two zero-length arrays', () => {
            expect(deep.equal([],[])).true;
        });

        it('should match two arrays with the same content', () => {
            expect(deep.equal([1,2,3],[1,2,3])).true;
        });

        it('should not match two arrays with different lengths', () => {
            expect(deep.equal([1,2,3],[1,2])).false;
        });

        it('should not match two arrays with the same length but different content', () => {
            expect(deep.equal([1,2,3],[4,5,6])).false;
        });

        it('should not match two arrays with the same length but partially matching content', () => {
            expect(deep.equal([1,2,3],[1,2,4])).false;
        });

        it( 'should match two objects with no properties ', () => {
            expect(deep.equal({},{})).true;
        });

        it( 'should match two objects with the same keys and values', () => {
            const object = {
                a: true,
                b: 42,
                c: "Hello"
            };

            expect(deep.equal(object,{...object})).true;
        });

        it( 'should match two same assemblies of values', () => {
            const object = {
                a: true,
                b: 42,
                c: "Hello",
                d: [1,2,3],
                e: { f: 44, g: ["World"] },
                h: [{ i1: "A", i2: "B"}, {i1: "C", i2:"D"}]       
            };

            const clone = { 
                a: true,
                b: 42,
                c: "Hello",
                d: [1,2,3],
                e: { f: 44, g: ["World"] },
                h: [{ i1: "A", i2: "B"}, {i1: "C", i2:"D"}]       
            }
            
            expect(deep.equal(object,clone)).true;
        });

        it('should ignore properties with undefined values when comparing objects', () => {
            const object1 = { a: 42 };
            const object2 = { a: 42, b: <string>undefined};
            expect(deep.equal(object1, object2)).true;
        });
        
    });
});