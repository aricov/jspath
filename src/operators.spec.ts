import { expect } from 'chai';

import { builtin as operators } from './operators';

describe('Operators', () => {
    describe('- empty', () => {
        it('is fully covered by `deep.empty` tests', () => {
        });
    });

    describe('- is', () => {
        it('should not match two undefined', () => {
            expect(operators.is(undefined, undefined)).false;
        });

        it('is otherwise covered by `deep.equal` tests', () => {
        });
    });

    describe('- in', () => {
        it('should match a boolean value of true in an array', () => {
            expect(operators.in(true, [false, true, false])).true;
        });

        it('should match a boolean value of false in an array', () => {
            expect(operators.in(false, [true, false, true])).true;
        });

        it('should match a numeric value in an array', () => {
            expect(operators.in(42, [41,42,43])).true;
        });

        it('should match a string value in an array', () => {
            expect(operators.in('world', ['Hello', 'world', 'goodbye'])).true;
        });

        it('should not match anything in an empty array array', () => {
            expect(operators.in(true, []), 'on true value').false;
            expect(operators.in(false, []), 'on false value').false;
            expect(operators.in(42, []), 'on numeric value').false;
            expect(operators.in('world', []), 'on string value').false;
            expect(operators.in('', []), 'on empty string').false;
        });

        it('should match complex values in an array using the `is` operator', () => {
            const catalog = [
                {code: 20, size: 'S'}, {code: 20, size: 'M'}, {code: 20, size: 'L'},
                {code: 30, size: 'S'}, {code: 30, size: 'M'}, {code: 30, size: 'L'}, {code: 30, size: 'XL'}
            ];
            expect(operators.in({code: 30, size: 'M'}, catalog)).true;
        });

    });
});