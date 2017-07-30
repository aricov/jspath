export class RootScope {
    readonly type = 'root';
    constructor(public readonly index = 0) {}
}

export class RelativeScope {
    readonly type = 'relative';
    constructor(public readonly index = 1) {}
}

export type Scope = RootScope | RelativeScope

export class All {
    readonly type = 'all';
    constructor(public readonly descendants = false) {}
}

export class Element {
    readonly type = 'element';
    constructor(public readonly index: number) {}
}

export class Elements {
    readonly type = 'elements';
    constructor(public readonly indices: number[]) {}
}

export class Named {
    readonly type = 'named';
    constructor(public readonly names: string[], public readonly descendants = false) {}
}

export class Slice {
    readonly type = 'slice';
    constructor(
        public readonly start = 0, 
        public readonly end = Infinity, 
        public readonly step = 1) {}
}

export class Filter {
    readonly type = 'filter';
    constructor(public readonly expr: Expression, public readonly descendants = false) {}
} 

export type Component = Scope | Named | Elements | Slice | All | Filter;

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

export type PathQualifier = 'some' | 'every';

export interface PathTerm {
    readonly type: 'path';
    readonly value: Path;
    readonly qualifier?: PathQualifier;
}

export interface ValueTerm {
    readonly type: 'value';
    readonly value: any;
}

export type Term = PathTerm | ValueTerm; 
