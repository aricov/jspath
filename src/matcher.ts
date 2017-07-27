export class Matcher {
    constructor(
        public readonly match: (scopes:any[], source: any)=>Match[], 
        public readonly multi:boolean=false
    ){}
}

export interface PathMatcher {
    match: (scopes: any[]) => Match[];
    multi: boolean;
}

export type MatchPath = (string | number)[];

export interface Match {
    path: MatchPath;
    value: any;
}

export const matchRoot = (scopes: any[], index = 0) : Match[] => {
    if ( scopes === undefined || scopes === null ) return [];
    if ( index < 0 || index >= scopes.length ) return [];

    return [{
        path: [index],
        value: scopes[index]
    }];
};

export const matchRelative = (scopes: any[], index = 0) : Match[] => {
    if ( scopes === undefined || scopes === null ) return [];
    return matchRoot(scopes, scopes.length -1 -index);    
}

export const matchIndices = (source: any, indices: number[]): Match[] => {
    if ( !Array.isArray(source ) )
        return [];
    
    return indices
        .filter(index => index >= 0 && index < source.length)
        .map(index => ({
            path: [index],
            value: source[index],
            multi: indices.length > 1
        }));
};

export const matchSlice = (source: any, start=0, end=Infinity, step=1): Match[] => {
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

export const matchChildNames = (source: any, names: string[]): Match[] => {
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

export const matchDescendants = (source: any, names: string[]): Match[] => {
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

export const matchAllDescendants = (source: any): Match[] => {
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
    
    const initial:Match[] = matchAllChildren(source);

    if ( Array.isArray(source) ) {
        return source.reduce(
            (matches, item, index) => {
                const sub = matchAllDescendants(item)
                    .map(match => ({ ...match, path: [index, ...match.path]}) )
                return [...matches, ...sub ]
            }, 
            initial
        );
    }     


    return Object.keys(source).reduce(
            (matches, key) => {
                const sub = matchAllDescendants(source[key])
                    .map(match => ({...match, path: [key, ...match.path]}) );
                return [...matches, ...sub]
            }, 
            initial
        );
};

export const matchAllChildren = (source: any): Match[] => {
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

export const filterChildren = (scopes: any[], source: any, filter:(childscopes: any[])=>boolean): Match[] => {
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

const MULTI = true;

export const Matchers = {
    filter: (flt: (x:any[])=>boolean) => new Matcher((scopes: any[], source: any) => filterChildren(scopes, source, flt), true),
    elements: (indices: number[]) => new Matcher((scopes: any[], source: any) => matchIndices(source, indices), MULTI),
    slice: (start?: number, end?: number, step?:number) => new Matcher((scopes: any[], source:any) => matchSlice(source, start, end, step), true),
    none: (multi: boolean) => new Matcher((scopes: any[], source: any) => [], multi),

    named: (names: string[], descendants: boolean) => {
        const multi = names.length > 1;
        if ( descendants ) 
            return new Matcher((scopes: any[], source: any) => matchDescendants(source, names), multi);
        else 
            return new Matcher((scopes: any[], source: any) => matchChildNames(source, names), multi);
    },
    root: (index: number) => new Matcher((scopes: any[], source: any) => matchRoot(scopes, index)),
    relative: (index: number) => new Matcher((scopes: any[], source: any) => matchRelative(scopes, index)),
    all: (descendants: boolean) => descendants ? 
        new Matcher((scopes: any[], source:any) => matchAllDescendants(source)) :
        new Matcher((scopes: any[], source:any) => matchAllChildren(source))
}
