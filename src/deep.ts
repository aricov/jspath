export const equal = (lhs: any, rhs: any): boolean => {
    if ( typeof lhs != typeof rhs ) return false;
    
    if( lhs === null ) return lhs === rhs;

    switch(typeof lhs) {
        case 'undefined': // for deep equality  we need to accept that undefined === undefined, 
                            // because we're using it recursively for array elements.
        case 'boolean':
        case 'number':
        case 'string':
        case 'symbol':
        case 'function':
            return lhs === rhs;
    }

    if ( Array.isArray(lhs) ) {
        if ( !Array.isArray(rhs) ) return false;            
        if ( lhs.length !== rhs.length ) return false;

        return Object.keys(lhs).every((k, idx) => equal(lhs[idx], rhs[idx]));
    }

    // We want to treat missing properties and properties with 'undefined' value equally.
    // And we need to sort the keys to have them in the same order for comparing them.
    const lkeys = Object.keys(lhs).filter(key => lhs[key] !== undefined).sort(); 
    const rkeys = Object.keys(rhs).filter(key => rhs[key] !== undefined).sort(); 

    if ( ! equal(lkeys, rkeys) ) return false;

    return lkeys.every(key => equal(lhs[key], rhs[key]));
};

export const empty = (value: any): boolean => {
    switch (typeof value ) {
        case 'undefined': 
            return true
        case 'boolean':
        case 'number':
        case 'symbol':
        case 'function':
            return false;
        case 'string':
            return value === '';
    }

    if ( value === null ) return true;

    if ( Array.isArray(value) ) {
        return value.every(empty);
    }

    return Object.keys(value).every(key => empty(value[key]));   
};