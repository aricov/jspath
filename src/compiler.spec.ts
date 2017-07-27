import { compileExpression, compilePath } from './compiler';
import { Expr, $, _, Child, Desc } from './builder';
import { expect } from 'chai';

describe('Compiler', () => {

    describe(' - Expressions:', () => {
        it('Tautology: 42 is 42', () => {
            const expr = Expr.is(Expr.value(42), Expr.value(42));
            const fn = compileExpression(expr);
            expect(fn([])).true;
        });

        it('Impossibility: 41 is 42', () => {
            const expr = Expr.is(Expr.value(41), Expr.value(42));
            const fn = compileExpression(expr);
            expect(fn([])).false;
        });

        it('Negate impossibility: not 41 is 42', () => {
            const expr = Expr.not.is(Expr.value(41), Expr.value(42));
            const fn = compileExpression(expr);
            expect(fn([])).true;
        });

        describe('$ is 42', () => {
            const expr = Expr.is(Expr.path($), Expr.value(42));
            const fn = compileExpression(expr);
            it('should match a root value of 42', () => {
                expect(fn([42])).true;
            });
            it('should not match a root value of 41', () => {
                expect(fn([41])).false;
            });
            it('should not match an object with a property of value 42', () => {
                expect(fn([{ prop: 42} ])).false;
            });
            it('should not match an array with an element of value 42', () => {
                expect(fn([ [42] ])).false;
            });
        });

        describe('@ is 42', () => {
            const expr = Expr.is(Expr.path(_), Expr.value(42));
            const fn = compileExpression(expr);
            it('should match a root value of 42', () => {
                expect(fn([42])).true;
            });
            it('should not match a root value of 41', () => {
                expect(fn([41])).false;
            });
            it('should not match an object with a property of value 42', () => {
                expect(fn([{ prop: 42} ])).false;
            });
            it('should not match an array with an element of value 42', () => {
                expect(fn([ [42] ])).false;
            });
        });

        describe('@.prop is 42', () => {
            const expr = Expr.is(Expr.path(_, Child.named('prop')), Expr.value(42));
            const fn = compileExpression(expr);
            it('should not match a root value of 42', () => {
                expect(fn([42])).false;
            });
            it('should match an object with a property of value 42', () => {
                expect(fn([{ prop: 42} ])).true;
            });
            it('should not match an object with a descendant property of value 42', () => {
                expect(fn([{ a: {prop: 42}} ])).false;
                expect(fn([{ prop: {a: 42}} ])).false;
                expect(fn([{ prop: [42]} ])).false;
            });
            it('should not match an array with an element of value 42', () => {
                expect(fn([ [42] ])).false;
            });
        });


        describe('@.a is @.b', () => {
            const expr = Expr.is(Expr.path(_, Child.named('a')), Expr.path(_, Child.named('b')));
            const fn = compileExpression(expr);
            it('should match an object with two equal numeric properties a and b', () => {
                expect(fn([ {a: 42, b: 42} ])).true;
            });
            it('should match an object with two equal string properties a and b', () => {
                expect(fn([ {a: "HHGG", b: "HHGG"} ])).true;
            });
            it('should match an object with two equal true properties a and b', () => {
                expect(fn([ {a: true, b: true} ])).true;
            });
            it('should match an object with two equal false properties a and b', () => {
                expect(fn([ {a: false, b: false} ])).true;
            });
            it('should match an object with two equal null properties a and b', () => {
                expect(fn([ {a: null, b: null} ])).true;
            });
            it('should match an object with undefined properties a and b', () => {
                expect(fn([ {a: undefined, b: undefined} ])).false;
                expect(fn([ {a: undefined} ])).false;
                expect(fn([ {b: undefined} ])).false;
            });
            it('should not match an object with a null and an undefined properties', () => {
                expect(fn([ {a: null, b: undefined} ])).false;
                expect(fn([ {a: null} ])).false;
            });
            it('should not match an object with two different properties a and b', () => {
                expect(fn([ {a: 41, b: 42} ])).false;
            });
             it('should not match an object with missing "b" property', () => {
                expect(fn([ {a: 41} ])).false;
            });
            it('should not match at a deeper level', () => {
                expect(fn([ {prop: {a: 42, b: 42}} ])).false;
            });
            it('should not match descendant properties', () => {
                expect(fn([ {k: {a: 42}, l:{b: 42}} ])).false;
            });
        });
    });

    describe(' - Filters', () => {
        it ('should find an element of an array by numeric value', () => {
            const expr = Expr.is(Expr.path(_), Expr.value(42));
            const compiled = compilePath([$, Child.filter(expr)]);
            expect(compiled.multi).true;
            expect(compiled.match([ [40,41,42,43] ])).to.deep.equal([{
                path: [0, 2],
                value: 42
            }]);
        });

        it ('should find multiple elements of an array by numeric value', () => {
            const expr = Expr.is(Expr.path(_), Expr.value(42));
            const compiled = compilePath([$, Child.filter(expr)]);
            expect(compiled.multi).true;
            expect(compiled.match([ [42,41,42,42,43] ])).to.deep.equal([{
                path: [0, 0],
                value: 42
            },{
                path: [0, 2],
                value: 42
            },{
                path: [0, 3],
                value: 42
            }]);
        });

        it ('should find an element of an array by string value', () => {
            const expr = Expr.is(Expr.path(_), Expr.value('goodbye'));
            const compiled = compilePath([$, Child.filter(expr)]);
            expect(compiled.multi).true;
            expect(compiled.match([ ['hello', 'world', 'goodbye', 'cruel', 'world'] ])).to.deep.equal([{
                path: [0, 2],
                value: 'goodbye'
            }]);
        });

        it ('should find an element of an array by its child property value', () => {
            const expr = Expr.is(Expr.path(_, Child.named('a')), Expr.value(42));
            const compiled = compilePath([$, Child.filter(expr)]);
            expect(compiled.multi).true;
            expect(compiled.match([ [{'a': 40}, {'a': 41}, {'a': 42}, {'a': 43}, {'a':44}] ])).to.deep.equal([{
                path: [0, 2],
                value: {'a': 42}
            }]);
        });

        it ('should find a child of an object by its child property value', () => {
            const expr = Expr.is(Expr.path(_, Child.named('a')), Expr.value(42));
            const compiled = compilePath([$, Child.filter(expr)]);
            expect(compiled.multi).true;
            expect(compiled.match([ {'A': {'a': 40}, 'B': {'a': 41}, 'C': {'a': 42}, 'D': {'a': 43}, 'E': {'a':44}} ]))
                .to.deep.equal(
                    [{
                        path: [0, 'C'],
                        value: {'a': 42}
                    }]
                );
        });
        
        it ('should find multiple chidlren of an object by their child property value', () => {
            const expr = Expr.is(Expr.path(_, Child.named('a')), Expr.value(42));
            const compiled = compilePath([$, Child.filter(expr)]);
            expect(compiled.multi).true;
            expect(compiled.match([ {'A': {'a': 42}, 'B': {'a': 41}, 'C': {'a': 42}, 'D': {'a': 43}, 'E': {'a':42}} ]))
                .to.deep.equal(
                    [{
                        path: [0, 'A'],
                        value: {'a': 42}
                    },{
                        path: [0, 'C'],
                        value: {'a': 42}
                    },{
                        path: [0, 'E'],
                        value: {'a': 42}
                    }]
                );
        });

        it ('should find descnedants of an object by their child property value', () => {
            const expr = Expr.is(Expr.path(_, Child.named('a')), Expr.value(42));
            const compiled = compilePath([$, Desc.filter(expr)]);
            expect(compiled.multi).true;
            expect(compiled.match([ {'A': { 'x': {'a': 42}}, 'B': {'x': {'a': 41}, 'y': {'a': 42}}, 'C': {'a': 43}, 'D': {'a':42}} ]))
                .to.deep.equal(
                    [{
                        path: [0, 'D'],
                        value: {'a': 42}
                    },{
                        path: [0, 'A', 'x'],
                        value: {'a': 42}
                    },{
                        path: [0, 'B', 'y'],
                        value: {'a': 42}
                    }]
                );
        });

    });
});
