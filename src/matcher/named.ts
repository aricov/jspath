import { Match } from './match';

export const children = (source: any, names: string[]): Match[] => {
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
        return []; 
    
    return names
        .map(name => ({
            path: [name], 
            value: source[name]
        }))
        .filter(match => match.value !== undefined);
};

export const descendants = (source: any, names: string[]): Match[] => {
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

    if ( Array.isArray(source) ) {
        return source.reduce(
            (matches, item, index) => {
                const sub = descendants(item, names)
                    .map(match => ({ ...match, path: [index, ...match.path]}) )
                return [...matches, ...sub ]
            }, 
            []
        );
    }     

    const initial:Match[] = children(source,names);

    return Object.keys(source).reduce(
            (matches, key) => {
                const sub = descendants(source[key], names)
                    .map(match => ({...match, path: [key, ...match.path]}) );
                return [...matches, ...sub]
            }, 
            initial
        );
};

