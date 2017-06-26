import { Path, Component } from './ast'

export type MatchPath = (string | number)[];

export interface Match {
    path: MatchPath;
    value: any;
}

export const prepend = (path: MatchPath) => (match: Match) => ({
    path : [...path, ...match.path],
    value: match.value
});

export const matcher = (path: Path) => (source: any): Match[] => 
    path.reduce(
        (matches, comp) => matches.reduce(
            (previous, match) => [
                ...previous, 
                ...matchComponent(match.value, comp).map(prepend(match.path))
            ], 
            []
        ), 
        [{path: [], value: source}]
    );


const matchComponent = (source: any, comp: Component) : Match[] => {
    switch ( comp.type ) {
        case 'root' : 
            return matchRoot(source); 
        case 'child': 
            return matchChildNames(source, [comp.name]);
        case 'children':
            return matchChildNames(source, comp.names);
        case 'index': 
            return matchIndices(source, [comp.index]);
        case 'elements':
            return matchIndices(source, comp.indices);
        case 'slice':
            return matchSlice(source, comp.start, comp.end, comp.step);
        case 'descendant': 
            return matchDescendants(source, [comp.name]);
        case 'descendants': 
            return matchDescendants(source, comp.names);
        case 'all':
            return matchAllChildren(source);
        default:
            return [];
    }
};

const matchRoot = (source: any) : Match[] => {
    if ( typeof source === 'undefined' ) return [];

    return [{
        path: ['$'],
        value: source
    }];
};

const matchIndices = (source: any, indices: number[]): Match[] => {
    if ( !Array.isArray(source ) )
        return [];
    
    return indices
        .filter(index => index >= 0 && index < source.length)
        .map(index => ({
            path: [index],
            value: source[index]
        }));
};

const matchSlice = (source: any, start=0, end=Infinity, step=1): Match[] => {
    if ( !Array.isArray(source) ) 
        return [];

    const L = source.length;

    if ( L === 0 ) return [];

    const restrict = (n: number) => n >= 0 
        ? Math.min( n, L-1 )
        : Math.max( L-n, 0 )
        ;

    const s = restrict(start);
    const e = restrict(end);

    let matches = []; 
    for ( let i=s; i<e; i = i + step ) {
        matches.push({
            path: [i],
            value: source[i]
        });
    }
    return matches;
};

const matchChildNames = (source: any, names: string[]): Match[] => {
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

const matchDescendants = (source: any, names: string[]): Match[] => {
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
                const sub = matchDescendants(item, names)
                    .map(match => ({ ...match, path: [index, ...match.path]}) )
                return [...matches, ...sub ]
            }, 
            []
        );
    }     

    const initial:Match[] = matchChildNames(source,names);

    return Object.keys(source).reduce(
            (matches, key) => {
                const sub = matchDescendants(source[key], names)
                    .map(match => ({...match, path: [key, ...match.path]}) );
                return [...matches, ...sub]
            }, 
            initial
        );
};

const matchAllChildren = (source: any): Match[] => {
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
