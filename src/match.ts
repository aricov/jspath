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
            return matchChild(source, comp.name);
        case 'index': 
            return matchIndex(source, comp.index);
        case 'slice':
            return matchSlice(source, comp.start, comp.end, comp.step);
        case 'descendant': 
            return matchDescendants(source, comp.name);
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

const matchIndex = (source: any, index: number): Match[] => {
    if ( !Array.isArray(source) ) 
        return [];

    if ( index < 0 || index >= source.length ) 
        return [];
    
    return [{
        path: [index],
        value: source[index]
    }];
};

const matchSlice = (source: any, start=0, end=Infinity, step=1) => {
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

const matchChild = (source: any, name: string): Match[] => {
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
    
    const value = source[name];
    
    if ( typeof value === 'undefined' )
        return [];
    
    return [{
        path: [name],
        value: value
    }];
}

const matchDescendants = (source: any, name: string): Match[] => {
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
                const sub = matchDescendants(item, name)
                    .map(match => ({ ...match, path: [index, ...match.path]}) )
                return [...matches, ...sub ]
            }, 
            []
        );
    }     

    const initial:Match[] = source[name] !== undefined 
        ? [{ path: [name], value: source[name]}] 
        : [];

    return Object.keys(source).reduce(
            (matches, key) => {
                const sub = matchDescendants(source[key], name)
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
