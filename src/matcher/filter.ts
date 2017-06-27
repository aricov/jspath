import { Match } from './match';

export const children = (scopes: any[], source: any, filter:(childscopes: any[])=>boolean): Match[] => {
    switch ( typeof source ) {
        case 'undefined':
        case 'boolean':
        case 'number':
        case 'string':
        case 'symbol':
        case 'function':
            return [];
    }

    if ( source === null ) // typeof null === 'object' :( 
        return [];

    if ( Array.isArray(source) )
        return source.map((elt, index) => ({
            path: [index],
            value: elt
        }))
        .filter(m => filter([...scopes, m.value])); 
    
    return Object.keys(source)
        .map(key => ({
            path : [key],
            value: source[key]
        }))
        .filter(m => filter([...scopes, m.value]));
};

export const descendants = (scopes: any[], source: any, filter:(childscopes: any[])=>boolean): Match[] => {
    switch ( typeof source ) {
        case 'undefined':
        case 'boolean':
        case 'number':
        case 'string':
        case 'symbol':
        case 'function':
            return [];
    }

    if ( source === null ) // typeof null === 'object' :( 
        return [];

    const childMatches = children(scopes, source, filter);

    if ( Array.isArray(source) ) {
        return source.reduce(
            (matches, elt, index) => {
                const sub = descendants([...scopes, elt], elt, filter)
                    .map( match => ({...match, path: [index, ...match.path]}));
                return [ ...matches, ...sub]
            },
            childMatches);
    }

    return Object.keys(source).reduce(
        (matches, key) => {
            const sub = descendants([...scopes, source[key]], source[key], filter)
                .map( match => ({...match, path: [key, ...match.path]}));
            return [ ...matches, ...sub]
        },
        childMatches);
};
