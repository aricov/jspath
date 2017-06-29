export class Matcher {
    constructor(
        public readonly match: (source:any)=>Match[], 
        public readonly multi:boolean=false
    ){}
}

export type MatchPath = (string | number)[];

export interface Match {
    path: MatchPath;
    value: any;
}

export const matchRoot = (source: any) : Match[] => {
    if ( typeof source === 'undefined' ) return [];

    return [{
        path: ['$'],
        value: source
    }];
};

export const matchCurrent = (source: any) : Match[] => {
    if ( typeof source === 'undefined' ) return [];

    return [{
        path: ['@'],
        value: source
    }];
    
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

export const filterChildren = (source: any, filter:(child:any)=>boolean): Match[] => {
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
        .filter(m => filter(m.value)); 
    
    return Object.keys(source)
        .map(key => ({
            path : [key],
            value: source[key]
        }))
        .filter(m => filter(m.value));
};

const MULTI = true;

export const Matchers = {
    root: new Matcher(matchRoot),
    child: (name:string) => new Matcher((source: any) => matchChildNames(source, [name])),
    children: (names: string[]) => new Matcher((source: any) => matchChildNames(source, names), MULTI),
    filter: (flt: (x:any)=>boolean) => new Matcher((source: any) => filterChildren(source, flt), true),
    all: new Matcher(matchAllChildren),
    descendant: (name: string) => new Matcher((source: any) => matchDescendants(source, [name])),
    descendants: (names: string[]) => new Matcher((source: any) => matchDescendants(source, names), MULTI),
    element: (index: number) => new Matcher((source:any) => matchIndices(source, [index])),
    elements: (indices: number[]) => new Matcher((source: any) => matchIndices(source, indices), MULTI),
    slice: (start?: number, end?: number, step?:number) => new Matcher((source:any) => matchSlice(source, start, end, step), true),
    none: (multi: boolean) => new Matcher((source: any) => [], multi)
};
