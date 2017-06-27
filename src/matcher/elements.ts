import { Match } from './match';

export const byIndex = (source: any, indices: number[]): Match[] => {
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

export const slice = (source: any, start=0, end=Infinity, step=1): Match[] => {
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
