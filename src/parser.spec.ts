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

        it ( '[42]', () => {
            expect(parser.parse('[42]')).to.deep.equal([
                {type: 'index', index: 42}
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

        it ( '[*]', () => {
            expect(parser.parse('[*]')).to.deep.equal([
                {type: 'all'}
            ]);
        });
    });

    describe('Various combinations:', () => {
        it ( '$.books[3].price', () => {
            expect(parser.parse('$..books[3].price')).to.deep.equal([
                {type: 'root'},
                {type: 'descendant', name: 'books'},
                {type: 'index', index: 3},
                {type: 'child', name: 'price'}
            ])
        });
    });
});