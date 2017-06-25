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

export type Component = Root | Child | Indexed | Slice | All | Descendant

export type Path = Component[] 
