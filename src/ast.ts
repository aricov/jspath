export class RootScope {
    readonly type = 'root';
    constructor(public readonly index = 0) {}
}

export class RelativeScope {
    readonly type = 'relative';
    constructor(public readonly index = 1) {}
}

export type Scope = RootScope | RelativeScope

export class Child {
    readonly type = 'child';
    constructor(public name: string) {}
}

export class All {
    readonly type = 'all';
}

export class Element {
    readonly type = 'element';
    constructor(public readonly index: number) {}
}

export class Elements {
    readonly type = 'elements';
    constructor(public readonly indices: number[]) {}
}

export class Children {
    readonly type = 'children';
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

export class Filter {
    readonly type = 'filter';
    constructor(public readonly filter: Expression) {}
} 

export type Component = Scope | Child | Children | Elements | Slice | All | Descendant | Descendants | Filter;

export type Path = Component[];

export class OrGroup {
    readonly type = 'or';
    constructor(public readonly lhs: Expression, public readonly rhs: Expression) {}
}

export class AndGroup {
    readonly type = 'and';
    constructor(public readonly lhs: Expression, public readonly rhs: Expression) {}
}

export class UnaryExpression {
    readonly type = 'unary';
    constructor(
        public readonly op: string,
        public readonly neg = false,
        public readonly lhs: Term
    ){}
} 

export class BinaryExpression {
    readonly type = 'binary';
    constructor(
        public readonly op: string,
        public readonly neg = false,
        public readonly lhs: Term,
        public readonly rhs: Term
    ){}
}

export type Expression = OrGroup | AndGroup | BinaryExpression | UnaryExpression

export class PathTerm {
    public readonly type = 'path';
    constructor(
        public readonly value: Path
    ){} 
}

export class ValueTerm {
    public readonly type = 'value';
    constructor(
        public readonly value: any
    ){} 
}

export type Term = PathTerm | ValueTerm; 