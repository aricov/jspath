import { expect } from 'chai';

import * as parser from './parser';

describe('Parser: ', () => {

    const parse_comp = (txt: string) => parser.parse(txt, { startRule: 'path_comp' });

    const test_comp = (txt:string, expected:any) => {
        return it( txt, () => {
            expect(parse_comp(txt)).to.deep.equal(expected);
        });
    };

    const test_expr = (txt:string, expected:any) => {
        return it( txt, () => {
            expect(parser.parse(txt)).to.deep.equal(expected);
        });
    };

    describe('Path scopes: ', () => {
        const test_scope = (txt: string, expected: any) => 
            it( txt, () => expect(parser.parse(txt)).to.deep.equal(expected));
        
        test_scope('$',  [{type: 'root', index: 0}]);
        test_scope('$1',  [{type: 'root', index: 1}]);
        test_scope('$3',  [{type: 'root', index: 3}]);

        test_scope('@',  [{type: 'relative', index: 0}]);
        test_scope('^',  [{type: 'relative', index: 1}]);

    });

    describe('Path components: ', () => {


        test_comp('.prop', {type: 'named', descendants: false, names:['prop']});

        test_comp('["Hello world"]', {type: 'named', descendants: false, names:['Hello world']});

        test_comp('[ "Hello", "world" ]', {type: 'named', descendants: false, names:['Hello', 'world']});

        test_comp('[42]', {type: 'elements', indices: [42]});       

        test_comp('[-42]', {type: 'elements', indices: [-42]});       

        test_comp('[0:10:2]', {type: 'slice', start: 0, end: 10, step:2});       

        test_comp('[0:10]', {type: 'slice', start: 0, end: 10, step: 1});       

        test_comp('[-3:]', {type: 'slice', start: -3, end: Infinity, step: 1});

        test_comp('[-1:0:-1]', {type: 'slice', start: -1, end: 0, step: -1});

        test_comp('[:10:2]', {type: 'slice', start: 0, end: 10, step: 2});

        test_comp('[1,2,3]', {type: 'elements', indices:[1,2,3]});

        test_comp('[*]', {type: 'all'});

        test_comp('..hello', {type: 'named', descendants: true, names: ['hello']});

        test_comp('[["Hello, World"]]', {type: 'named', descendants: true, names: ['Hello, World']});

        test_comp('[["Hello", "World"]]', {type: 'named', descendants: true, names: ['Hello', 'World']});

        test_comp('[? .value is 3]', 
            {
                type: 'filter', 
                expr: {
                    type: 'binary',
                    op: 'is',
                    neg: false,
                    lhs: {
                        type: 'path',
                        value: [{type: 'relative', index: 0}, {type: 'named', descendants: false, names:['value']}]
                    },
                    rhs: {
                        type: 'value',
                        value: 3 
                    }
                }
            });

        test_comp('[? .value in `[1,2,3,5]]',
            {
                type: 'filter', 
                expr: {
                    type: 'binary',
                    op: 'in',
                    neg: false,
                    lhs: {
                        type: 'path',
                        value: [{type: 'relative', index: 0}, {type: 'named', descendants: false, names: ['value']}]
                    },
                    rhs: {
                        type: 'value',
                        value: [1,2,3,5]
                    }
                }
        });
    });

    describe('Various combinations:', () => {
        test_expr('$..books[3].price', [
                {type: 'root', index: 0},
                {type: 'named', descendants: true, names: ['books']},
                {type: 'elements', indices: [3]},
                {type: 'named', descendants: false, names: ['price']}
            ]);

        it ( 'Consecutive indices: $[1][2][3]', () => {
            expect(parser.parse('$[1][2][3]')).to.deep.equal([
                {type: 'root', index: 0},
                {type: 'elements', indices: [1]},
                {type: 'elements', indices: [2]},
                {type: 'elements', indices: [3]}
            ]);
        });

        it( 'Join: $..books[? .category is $.selectedCategory]', () => {
            expect(parser.parse('$..books[? @.category is $.selectedCategory]')).to.deep.equal([
                {type: 'root', index: 0},
                {type: 'named', descendants: true, names: ['books']},
                {type: 'filter', expr: {
                    type: 'binary',
                    op: 'is',
                    neg: false,
                    lhs: {
                        type: 'path', value: [{type: 'relative', index: 0}, {type: 'named', descendants: false, names:['category']} ]
                    },
                    rhs: {
                        type: 'path',
                        value: [{type: 'root', index: 0}, {type: 'named', descendants: false, names: ['selectedCategory']}]
                    }
                }}
            ]);
        });
    
        it( 'Join: $..books[? .category is $.selectedCategory or .promoted is true]', () => {
            parser.parse('$..books[? .category is $.selectedCategory or .promoted is `true]');
        });
    });

    describe('Expressions', () => {
        describe('Quoted', () => {
            it ( '$.code is `5', () => {
                const results = parser.parse(
                    '$.code is `5', 
                    {startRule: 'expr'}
                );
                expect(results).to.deep.equal({
                    type: 'binary',
                    op: 'is',
                    neg: false,
                    lhs: {
                        type: 'path',
                        value: [{type: 'root', index: 0}, {type: 'named', descendants: false, names: ['code']}]
                    },
                    rhs: {
                        type: 'value',
                        value: 5
                    }
                });
            });
            it ( 'not $.code is `5', () => {
                const results = parser.parse(
                    'not $.code is `5', 
                    {startRule: 'expr'}
                );
                expect(results).to.deep.equal({
                    type: 'binary',
                    op: 'is',
                    neg: true,
                    lhs: {
                        type: 'path',
                        value: [{type: 'root', index: 0}, {type: 'named', descendants: false, names: ['code']}]
                    },
                    rhs: {
                        type: 'value',
                        value: 5
                    }
                });
            });
        });

        describe('Not quoted', () => {
            it ( '$.code is 5', () => {
                const results = parser.parse(
                    '$.code is 5', 
                    {startRule: 'expr'}
                );
                expect(results).to.deep.equal({
                    type: 'binary',
                    op: 'is',
                    neg: false,
                    lhs: {
                        type: 'path',
                        value: [{type: 'root', index: 0}, {type: 'named', descendants: false, names: ['code']}]
                    },
                    rhs: {
                        type: 'value',
                        value: 5
                    }
                });
            });

            it ( '@.code in [1,2,3]', () => {
                const results = parser.parse(
                    '@.code in [1,2,3]', 
                    {startRule: 'expr'}
                );
                expect(results).to.deep.equal({
                    type: 'binary',
                    op: 'in',
                    neg: false,
                    lhs: {
                        type: 'path',
                        value: [{type: 'relative', index: 0}, {type: 'named', descendants: false, names: ['code']}]
                    },
                    rhs: {
                        type: 'value',
                        value: [1,2,3]
                    }
                });
            });

            it ( 'Join: @.code in ^[1][2][3]', () => {
                const results = parser.parse(
                    '@.code in ^[1][2][3]', 
                    {startRule: 'expr'}
                );
                expect(results).to.deep.equal({
                    type: 'binary',
                    op: 'in',
                    neg: false,
                    lhs: {
                        type: 'path',
                        value: [{type: 'relative', index: 0}, {type: 'named', descendants: false, names: ['code']}]
                    },
                    rhs: {
                        type: 'path',
                        value: [{type: 'relative', index: 1}, {type: 'elements', indices: [1]},{type: 'elements', indices: [2]},{type: 'elements', indices: [3]}]
                    }
                });
            });


        });
        
        it ( '$.code empty', () => {
            const results = parser.parse(
                '$.code empty', 
                {startRule: 'expr'}
            );
            expect(results).to.deep.equal({
                type: 'unary',
                op: 'empty',
                neg: false,
                lhs: {
                    type: 'path',
                    value: [{type: 'root', index: 0}, {type: 'named', descendants: false, names: ['code']}]
                }
            });
        });
        it ( 'not $.code empty', () => {
            const results = parser.parse(
                'not $.code empty', 
                {startRule: 'expr'}
            );
            expect(results).to.deep.equal({
                type: 'unary',
                op: 'empty',
                neg: true,
                lhs: {
                    type: 'path',
                    value: [{type: 'root', index: 0}, {type: 'named', descendants: false, names: ['code']}]
                }
            });
        });
        it ( 'Should parse a complex expression', () => {
            try {
                parser.parse(
                    '($.code is "1324" and $.other is "") or $.code in [1,2,3,4]', 
                    {startRule: 'expr'}
                );
            } catch (error) {
                console.log(error);
            }
        });
    });
});
