import { Path } from './api';

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
        const actual = Path.parse('$.catalog[1]')
                .compile()
                .value(state);
        expect(actual).to.deep.equal(state.catalog[1]);
    });

    it( 'should extract all the prices', () => {
         const actual = Path.compile('$.catalog[*].price').values(state);
         const expected = state.catalog.map(bk => bk.price);
         expect(actual).to.deep.equal(expected);
    });

    it( 'should filter selection by quantity', () => {
         const actual = Path.compile('$.basket.selection[? .quantity is 2]')
                .value(state);
         expect(actual).to.deep.equal(state.basket.selection[0]);
    });

    it('should filter the first selection by quantity', () => {
        const path = Path.compile('$[? @.selection[0].quantity is 2].total');
        expect(path.value(state)).to.equal(15.98);
    });

    it('should filter selection children by quantity', () => {
        const path = Path.compile('$[? 2 in @.selection[*].quantity].total');
        expect(path.value(state)).to.equal(15.98);
    });

    it('should find basket products with quantity of 2', () => {
        const path = Path.compile('$.basket.selection[? .quantity is 2].product');
        expect(path.value(state)).to.equal(20);
    });
 
    it('should find the catalog prices of the books included in the basket selection', () => {
        const path = Path.compile('$.catalog[? .id in $.basket.selection[*].product].price');
        expect(path.value(state)).to.equal( state.catalog[1].price );
    });

});