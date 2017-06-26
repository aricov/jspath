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
                {type: 'slice', start: 0, end: 10}
            ]);        
        });

        it ( '[-3:]', () => {
            expect(parser.parse('[-3:]')).to.deep.equal([
                {type: 'slice', start: -3}
            ]);        
        });

        it ( '[-1:0:-1]', () => {
            expect(parser.parse('[-1:0:-1]')).to.deep.equal([
                {type: 'slice', start: -1, end: 0, step: -1}
            ]);        
        });

        it ( '[:10:2]', () => {
            expect(parser.parse('[:10:2]')).to.deep.equal([
                {type: 'slice', end: 10, step: 2}
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
    });
});