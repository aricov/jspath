import { expect } from 'chai';

import * as parser from './parser';

describe('Parser: ', () => {

    describe('Path components: ', () => {

        it( '$' , () => {
            expect(parser.parse('$')).to.deep.equal([
                {type: 'root'}
            ])
        });

        it ( '.prop', () => {
            expect(parser.parse('.prop')).to.deep.equal([
                {type: 'child', name:'prop'}
            ]);
        })

        it ( '["Hello world"]', () => {
            expect(parser.parse('["Hello world"]')).to.deep.equal([
                {type: 'child', name:'Hello world'}
            ]);
        });

        it ( '["Hello","world"]', () => {
            expect(parser.parse('[ "Hello", "world" ]')).to.deep.equal([
                {type: 'children', names:['Hello', 'world']}
            ]);
        });

        it ( '[42]', () => {
            expect(parser.parse('[42]')).to.deep.equal([
                {type: 'element', index: 42}
            ]);        
        });

        it ( '[-42]', () => {
            expect(parser.parse('[-42]')).to.deep.equal([
                {type: 'element', index: -42}
            ]);        
        });

        it ( '[0:10:2]', () => {
            expect(parser.parse('[0:10:2]')).to.deep.equal([
                {type: 'slice', start: 0, end: 10, step:2}
            ]);        
        });

        it ( '[0:10]', () => {
            expect(parser.parse('[0:10]')).to.deep.equal([
                {type: 'slice', start: 0, end: 10, step: 1}
            ]);        
        });

        it ( '[-3:]', () => {
            expect(parser.parse('[-3:]')).to.deep.equal([
                {type: 'slice', start: -3, end: Infinity, step: 1}
            ]);        
        });

        it ( '[-1:0:-1]', () => {
            expect(parser.parse('[-1:0:-1]')).to.deep.equal([
                {type: 'slice', start: -1, end: 0, step: -1}
            ]);        
        });

        it ( '[:10:2]', () => {
            expect(parser.parse('[:10:2]')).to.deep.equal([
                {type: 'slice', start: 0, end: 10, step: 2}
            ]);        
        });

        it ( '[1,2,3]', () => {
            expect(parser.parse('[1,2,3]')).to.deep.equal([
                {type: 'elements', indices:[1,2,3]}
            ]);
        });

        it ( '[*]', () => {
            expect(parser.parse('[*]')).to.deep.equal([
                {type: 'all'}
            ]);
        });

        it ( '..hello', () => {
            expect(parser.parse('..hello')).to.deep.equal([
                {type: 'descendant', name: 'hello'}
            ]);
        });

        it ( '[["Hello, World"]]', () => {
            expect(parser.parse('[["Hello, World"]]')).to.deep.equal([
                {type: 'descendant', name: 'Hello, World'}
            ]);
        });

        it ( '[["Hello", "World"]]', () => {
            expect(parser.parse('[["Hello", "World"]]')).to.deep.equal([
                {type: 'descendants', names: ['Hello', 'World']}
            ]);
        });

        it ( '[? @.value is 3]', () => {
            expect(parser.parse('[? @.value is 3]')).to.deep.equal([{
                    type: 'filter', 
                    expr: {
                        type: 'binary',
                        op: 'is',
                        neg: false,
                        lhs: {
                            type: 'path',
                            value: [{type: 'current'}, {type: 'child', name: 'value'}]
                        },
                        rhs: {
                            type: 'value',
                            value: 3 
                        }
                    }
            }]);
        });

        it ( '[? @.value in `[1,2,3, 5]]', () => {
            expect(parser.parse('[? @.value in `[1,2,3,5]]')).to.deep.equal([{
                    type: 'filter', 
                    expr: {
                        type: 'binary',
                        op: 'in',
                        neg: false,
                        lhs: {
                            type: 'path',
                            value: [{type: 'current'}, {type: 'child', name: 'value'}]
                        },
                        rhs: {
                            type: 'value',
                            value: [1,2,3,5]
                        }
                    }
            }]);
        });
    });

    describe('Various combinations:', () => {
        it ( '$..books[3].price', () => {
            expect(parser.parse('$..books[3].price')).to.deep.equal([
                {type: 'root'},
                {type: 'descendant', name: 'books'},
                {type: 'element', index: 3},
                {type: 'child', name: 'price'}
            ])
        });

        it ( 'Consecutive indices: $[1][2][3]', () => {
            expect(parser.parse('$[1][2][3]')).to.deep.equal([
                {type: 'root'},
                {type: 'element', index: 1},
                {type: 'element', index: 2},
                {type: 'element', index: 3}
            ]);
        });

        it( 'Join: $..books[? @.category is $.selectedCategory]', () => {
            expect(parser.parse('$..books[? @.category is $.selectedCategory]')).to.deep.equal([
                {type: 'root'},
                {type: 'descendant', name: 'books'},
                {type: 'filter', expr: {
                    type: 'binary',
                    op: 'is',
                    neg: false,
                    lhs: {
                        type: 'path', value: [{type: 'current'}, {type: 'child', name:'category'} ]
                    },
                    rhs: {
                        type: 'path',
                        value: [{type: 'root'}, {type: 'child', name: 'selectedCategory'}]
                    }
                }}
            ]);
        });
    
        it( 'Join: $..books[? @.category is $.selectedCategory or @.promoted is true]', () => {
            parser.parse('$..books[? @.category is $.selectedCategory or @.promoted is `true]');
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
                        value: [{type: 'root'}, {type: 'child', name: 'code'}]
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
                        value: [{type: 'root'}, {type: 'child', name: 'code'}]
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
                        value: [{type: 'root'}, {type: 'child', name: 'code'}]
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
                        value: [{type: 'current'}, {type: 'child', name: 'code'}]
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
                        value: [{type: 'current'}, {type: 'child', name: 'code'}]
                    },
                    rhs: {
                        type: 'path',
                        value: [{type: 'element', index: 1},{type: 'element', index: 2},{type: 'element', index: 3}]
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
                    value: [{type: 'root'}, {type: 'child', name: 'code'}]
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
                    value: [{type: 'root'}, {type: 'child', name: 'code'}]
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
