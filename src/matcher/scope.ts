import { Match } from  './match';

export const absolute = (scopes: any[], index = 0) : Match[] => {
    console.log('Matching scope at ', index, scopes);
    if ( scopes === undefined || scopes === null ) return [];
    if ( index < 0 || index >= scopes.length ) return [];

    return [{
        path: [index],
        value: scopes[index]
    }];
};

export const relative = (scopes: any[], index = 0) : Match[] => {
    if ( scopes === undefined || scopes === null ) return [];
    return absolute(scopes, scopes.length -1 -index);    
}
