import * as deep from './deep';

export type Operator = (lhs: any, rhs?:any) => boolean;

const is = (lhs: any, rhs: any) => {
    // Here we don't consider two undefined to be the same.
    if ( lhs === undefined || rhs === undefined ) return false;

    return deep.equal(lhs, rhs);
};


const isIn = (lhs: any, rhs: any) => {
        if ( lhs === undefined || rhs === undefined || rhs === null) return false;
        if ( Array.isArray(rhs) ) {
            return rhs.some(elt => is(lhs, elt))
        }
        return false;
};

const empty = (value: any) => deep.empty(value);

export type Operators = {[name:string]: Operator};

export const builtin: Operators = { 
    is,
    in: isIn,
    empty
};
