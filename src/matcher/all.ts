import { Match } from './match';

export const children = (source: any): Match[] => {
    switch ( typeof source ) {
        case 'undefined':
        case 'boolean':
        case 'number':
        case 'string':
        case 'symbol':
        case 'function':
            return [];
    }

    if ( source === null ) {
        return[];
    }    

    if ( Array.isArray(source) ) {
        return source.map((value, index) => ({
            path: [index],
            value
        }));
    }

    return Object.keys(source).map((key) => ({
            path: [key],
            value: source[key]
        }));

};


export const descendants = (source: any): Match[] => {
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
    
    const initial:Match[] = children(source);

    if ( Array.isArray(source) ) {
        return source.reduce(
            (matches, item, index) => {
                const sub = descendants(item)
                    .map(match => ({ ...match, path: [index, ...match.path]}) )
                return [...matches, ...sub ]
            }, 
            initial
        );
    }     


    return Object.keys(source).reduce(
            (matches, key) => {
                const sub = descendants(source[key])
                    .map(match => ({...match, path: [key, ...match.path]}) );
                return [...matches, ...sub]
            }, 
            initial
        );
};
