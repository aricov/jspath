export class Root {
    readonly type = 'root';
}

export class Child {
    readonly type = 'child';
    constructor(public name: string) {}
}

export class All {
    readonly type = 'all';
}

export class Indexed {
    readonly type = 'index';
    constructor(public readonly index: number) {}
}

export class Elements {
    readonly type = "elements";
    constructor(public readonly indices: number[]) {}
}

export class Children {
    readonly type = "children";
    constructor(public readonly names: string[]) {}
}

export class Slice {
    readonly type = 'slice';
    constructor(
        public readonly start = 0, 
        public readonly end = Infinity, 
        public readonly step = 1) {}
}

export class Descendant {
    readonly type = 'descendant';
    constructor(public readonly name: string) {}
}

export class Descendants {
    readonly type = 'descendants';
    constructor(public readonly names: string[]) {}
}

export type Component = Root | Child | Children | Indexed | Elements | Slice | All | Descendant | Descendants

export type Path = Component[] 
