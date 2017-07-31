export interface RootScope {
    readonly type: 'root';
    readonly index: number;
}

export interface RelativeScope {
    readonly type: 'relative';
    readonly index: number;
}

export type Scope = RootScope | RelativeScope

export interface All {
    readonly type: 'all';
    readonly descendants: boolean;
}

export interface Elements {
    readonly type: 'elements';
    readonly indices: number[];
}

export interface Named {
    readonly type: 'named';
    readonly names: string[];
    readonly descendants: boolean;
}

export interface Slice {
    readonly type: 'slice';
    readonly start: number; 
    readonly end: number;
    readonly step: number;
}

export interface Filter {
    readonly type: 'filter';
    readonly expr: Expression;
    readonly descendants: boolean;
} 

export type Component = Scope | Named | Elements | Slice | All | Filter;

export type Path = Component[];

export interface  OrGroup {
    readonly type: 'or';
    readonly lhs: Expression;
    readonly rhs: Expression;
}

export interface AndGroup {
    readonly type: 'and';
    readonly lhs: Expression; 
    readonly rhs: Expression;
}

export interface UnaryExpression {
    readonly type: 'unary';
    readonly op: string;
    readonly neg: boolean;
    readonly lhs: Term;
} 

export interface BinaryExpression {
    readonly type: 'binary';
    readonly op: string;
    readonly neg: boolean;
    readonly lhs: Term;
    readonly rhs: Term
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
