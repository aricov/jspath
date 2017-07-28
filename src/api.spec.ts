import * as parser from './parser';
import { compilePath } from './compiler';
import * as api from './api';

import { expect } from 'chai';

export const ignore = (decl: any): void => {};


describe('End to end usage', () => {
    const state = {
        catalog: [{
            id: 10,
            title: 'RxJS for beginners',
            category: 'programming',
            author: 'Stef',
            price: 19.80
        },{
            id: 20,
            title: 'Th HitchHicker\'s Guide to the Galaxy',
            category: 'fiction',
            author: 'Douglas Adams',
            price: 7.99
        }],
        basket: {
            selection:[{
                product: 20,
                quantity: 2
            }],
            total: 15.98
        }
    };

    it ('Should find the second book', () => {
        const path = compilePath(parser.parse('$.catalog[1]'));
        expect(api.values(state, path)).to.deep.equal([state.catalog[1]]);
    });

    it( 'should extract all the prices', () => {
         const path = compilePath(parser.parse('$.catalog[*].price'));
         const expected = state.catalog.map(bk => bk.price);
         expect(api.values(state, path)).to.deep.equal(expected);
    });

    it( 'should filter selection by quantity', () => {
         const path = compilePath(parser.parse('$.basket.selection[? .quantity is 2]'));
         expect(api.values(state, path)).to.deep.equal([state.basket.selection[0]]);
    });

    it('should filter the first selection by quantity', () => {
        const path = compilePath(parser.parse('$[? @.selection[0].quantity is 2].total'));
        expect(api.values(state, path)).to.deep.equal([15.98]);
    });

    it('should filter selection children by quantity', () => {
        const path = compilePath(parser.parse('$[? 2 in @.selection[*].quantity].total'));
        expect(api.values(state, path)).to.deep.equal([15.98]);
    });

    it('should find basket products with quantity of 2', () => {
        const path = compilePath(parser.parse('$.basket.selection[? .quantity is 2].product'));
        expect(api.values(state, path)).to.deep.equal([20]);
    });
 
    it('should find the catalog prices of the books included in the basket selection', ()=> {
        const path = compilePath(parser.parse('$.catalog[? .id in $.basket.selection[*].product].price'));
        expect(path.multi).true;
        expect(api.values(state, path)).to.deep.equal([ state.catalog[1].price ]);
    });

});