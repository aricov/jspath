import * as jp from './ast';
import { compilePath } from './compiler';
import { expect } from 'chai';

const matcher = (path: jp.Path) => (scope: any) => compilePath(path).match([scope]); 

export const _ = new jp.RelativeScope(0);

describe('Matcher: ', () => {

    const $ = new jp.RootScope();

    const child = {
        named : (name:string) => new jp.Named([name]),
        filter: (expr: jp.Expression) => new jp.Filter(expr, false),
        prop: new jp.Named(['prop']),
        length: new jp.Named(['length']),
        all:  new jp.All()
    };

    const desc = {
        prop: new jp.Named(['prop'], true),
        length: new jp.Named(['length'], true),
        all: new jp.All(true)
    };

    describe('The root path ($)', () => {
        const path = [$];
        const match = matcher(path);
        
        it ('should match an empty object' , () => {
            const results = match({});

            expect(results).to.be.an('array').that.has.lengthOf(1);
            expect(results[0]).to.deep.equal({ path: [0], value: {}} );
        });
        it ( 'should match an empty array', () => {
            const results = match([]);

            expect(results).to.be.an('array').that.has.lengthOf(1);
            expect(results[0]).to.deep.equal({ path: [0], value: []} );
        });
        it ( 'should match an empty string', () => {
            const results = match('');
            expect(results).to.be.an('array').that.has.lengthOf(1);
            expect(results[0]).to.deep.equal({ path: [0], value: ''} );
        });
        it ( 'should match a boolean', () => {
            const results = match(true);
            expect(results).to.be.an('array').that.has.lengthOf(1);
            expect(results[0]).to.deep.equal({ path: [0], value: true} );            
        });
        it ( 'should match a number', () => {
            const results = match(42);
            expect(results).to.be.an('array').that.has.lengthOf(1);
            expect(results[0]).to.deep.equal({ path: [0], value: 42} );            
        });
        it ( 'should match null', () => {
            const results = match(null);
            expect(results).to.be.an('array').that.has.lengthOf(1);
            expect(results[0]).to.deep.equal({ path: [0], value: null} );            
        });
        it ( 'should not match undefined', () => {
            const results = match(undefined);
            expect(results).to.be.an('array').that.has.lengthOf(0);
        });
    });

    describe('A child path ($.prop)', () => {
        const match = matcher([$, child.prop]);
        const matchLength = matcher([$, child.length]);

        it ( 'should match an object with the right property', () => {
            const results = match({ prop: 42 });
            expect(results).to.be.an('array').that.has.lengthOf(1);
            expect(results[0]).to.deep.equals({path: [0, 'prop'], value: 42});            
        });
        it ( 'should not match an empty object', () => {
            const results = match({});
            expect(results).to.be.an('array').that.has.lengthOf(0);            
        });
        it ( 'should not match an object without the right property', () => {
            const results = match({ a: 1, b: [], c: true, d: {}});
            expect(results).to.be.an('array').that.has.lengthOf(0);            
        });
        it ( 'should not match an object with a deeper property of the right name', () => {
            const results = match({ a: { prop: 42 }});
            expect(results).to.be.an('array').that.has.lengthOf(0);            
        });
        it ( 'should not match the length property of an array', () => {
            const results = matchLength([1,2,3]);
            expect(results).to.be.an('array').that.has.lengthOf(0);            
        });
        it ( 'should not match the length property of a string', () => {
            const results = matchLength("Hello World!");
            expect(results).to.be.an('array').that.has.lengthOf(0);            
        });  
        it ( 'should match a property named length of an object', () => {
            const results = matchLength({length: 42});
            expect(results).to.be.an('array').that.has.lengthOf(1);
            expect(results[0]).to.deep.equals({path: [0, 'length'], value: 42});            
        });
    });

    describe('A descendant path ($..prop)', () => {
        const match = matcher([$, desc.prop]);
        //const matchLength = matcher([$, desc.length]);

        it ( 'should match a child property', () => { 
            const results = match({prop: 42});
            expect(results).to.be.an('array').lengthOf(1)
                .that.deep.equals([{path: [0, 'prop'], value: 42}]);            
        });

        it ( 'should match a child of child property', () => {
            const results = match({ a: {prop: 42}});
            expect(results).to.be.an('array').lengthOf(1)
                .that.deep.equals([{path: [0, 'a', 'prop'], value: 42}]);            
        });

        it ( 'should match inside an array', () => {
            const results = match([{prop: 42}, {prop: 24}]);
            expect(results).to.be.an('array').lengthOf(2)
                .that.deep.equals([
                    {path: [0, 0, 'prop'], value: 42},
                    {path: [0, 1, 'prop'], value: 24}
                ]);            
        });

        it ( 'should match a property at all levels simultaneously', () => {
            const results = match({ 
                prop: 0, 
                a: {
                    prop: 1
                }, 
                b: { 
                    c: {
                        prop: 2
                    }
                },
                d: [{ 
                    e: 'd0',
                    prop: 3
                },{
                    e: 'd1',
                    prop: 4
                }]
            });
            expect(results).to.be.an('array').lengthOf(5)
                .that.deep.equals([
                    {path: [0, 'prop'], value: 0},
                    {path: [0, 'a', 'prop'], value: 1},            
                    {path: [0, 'b', 'c', 'prop'], value: 2},
                    {path: [0, 'd', 0, 'prop'], value: 3},
                    {path: [0, 'd', 1, 'prop'], value: 4}
                ]);            
        });

    });

    describe('A child union path for two properties ($["a", "b"])', () => {
        const match = matcher([$, new jp.Named(['a', 'b'])]);
        it ( 'should match both properties', () => {
            const results = match({ a:1, b:2, c: 3 });
            expect(results).to.deep.equal([
                {path: [0, 'a'], value: 1},
                {path: [0, 'b'], value: 2}
            ]);
        }); 
        it ( 'should match one property when the other is missing', () => {
            const results = match({ a:1, c: 3 });
            expect(results).to.deep.equal([
                {path: [0, 'a'], value: 1}
            ]);
        });
    });
        
    describe('An index union path for two indices ($[0, 2])', () => {
        const match = matcher([$, new jp.Elements([0, 2])]);
        it ( 'should find the first and third element of a four element array', () => {
            const results = match([1, 2, 3, 4]);
            expect(results).to.deep.equal([
                {path: [0, 0], value: 1},
                {path: [0, 2], value: 3}
            ]);
        }); 
        it ( 'should match the first element of a two elemnets array', () => {
            const results = match([1, 2]);
            expect(results).to.deep.equal([
                {path: [0, 0], value: 1}
            ]);
        });
    });
    
    describe('A path to all properties ($.* or $[*])', () => {
        const match = matcher([$, child.all]);
        it ( 'should match all elements of an array', () => {
            const results = match([ 1, 2, 3 ]);
            expect(results).to.deep.equal([
                {path: [0, 0], value:1},
                {path: [0, 1], value:2},
                {path: [0, 2], value:3}
            ]);
        });
        it ( 'should match all properties of an object', () => {
            const results = match({ a:1, b:2, c:3 });
            expect(results).to.deep.equal([
                {path: [0, 'a'], value:1},
                {path: [0, 'b'], value:2},
                {path: [0, 'c'], value:3}
            ]);
        });
        it ( 'should not flatten arrays', () => {
            const results = match([[ 1, 2, 3 ]]);
            expect(results).to.deep.equal([
                {path: [0, 0], value: [1,2,3]}
            ]);
        });
        it ( 'should not flatten objects', () => {
            const results = match({a: {b: 42}, c:[ 1, 2, 3 ]});
            expect(results).to.deep.equal([
                {path: [0, 'a'], value: {b: 42}},
                {path: [0, 'c'], value: [1,2,3]}
            ]);
        });
        it ( 'should flatten recursive matches', () => {
            const matchDeep = matcher([$, child.prop, child.all, new jp.Named(['a']), child.all]);
            const results = matchDeep({
                prop: [{
                    a: [1, 2, 3],
                    b: [4,5]
                },{
                    a: [6,7],
                    b: [8,9,10]
                }]
            });
            expect(results).to.deep.equal([
                {path: [0, 'prop', 0 , 'a' , 0], value: 1},
                {path: [0, 'prop', 0 , 'a' , 1], value: 2},
                {path: [0, 'prop', 0 , 'a' , 2], value: 3},
                {path: [0, 'prop', 1 , 'a' , 0], value: 6},
                {path: [0, 'prop', 1 , 'a' , 1], value: 7}
            ]);
        });
    });

    describe('A path to all descendants ($[**])', () => {
        const match = matcher([$, desc.all]);
        it('should flatten a simple object', () => {
            const results = match({ a:1, b:2, c:3 });
            expect(results).to.deep.equal([
                {path: [0, 'a'], value:1},
                {path: [0, 'b'], value:2},
                {path: [0, 'c'], value:3}
            ]);
        });

        it ( 'should match all elements of an array', () => {
            const results = match([ 1, 2, 3 ]);
            expect(results).to.deep.equal([
                {path: [0, 0], value:1},
                {path: [0, 1], value:2},
                {path: [0, 2], value:3}
            ]);
        });

        it ( 'should also flatten arrays', () => {
            const results = match([[ 1, 2, 3 ]]);
            expect(results).to.deep.equal([
                {path: [0, 0], value: [1,2,3]},
                {path: [0, 0, 0], value:1},
                {path: [0, 0, 1], value:2},
                {path: [0, 0, 2], value:3}
            ]);
        });

        it( 'should also flatten objects', () => {
            const results = match({a: {b: 42}, c:[ 1, 2, 3 ]});
            expect(results).to.deep.equal([
                {path: [0, 'a'], value: {b: 42}},
                {path: [0, 'c'], value: [1,2,3]},
                {path: [0, 'a', 'b'], value: 42},
                {path: [0, 'c', 0], value: 1},
                {path: [0, 'c', 1], value: 2},
                {path: [0, 'c', 2], value: 3}
            ]);
        });

    });


    describe('A slice selector', () => {
        const match = matcher([$, new jp.Slice(1,4,2)]);
        it ( 'Should extract elements 1 and 3', () => {
            expect(match(['a','b','c','d','e','f','g'])).to.deep.equal([
                {path: [0, 1], value: 'b'},
                {path: [0, 3], value: 'd'}
            ]);
        });
    });

});
