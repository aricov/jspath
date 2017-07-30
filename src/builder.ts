import * as ast from './ast';

export const $ = new ast.RootScope(0);
export const _ = new ast.RelativeScope(0);

export const Scope = {
    absolute: (index?: number) => new ast.RootScope(index),
    relative: (index?: number) => new ast.RelativeScope(index)
};

export const Child = {
    all: new ast.All(false),
    named: (...names:string[]) => new ast.Named(names, false),
    at: (...indices:number[]) => new ast.Elements(indices),
    slice: (start:number, end:number, step:number) => new ast.Slice(start, end, step),
    filter: (expr: ast.Expression) => new ast.Filter(expr, false)
};

export const Desc = {
    all: new ast.All(true),
    named: (...names:string[]) => new ast.Named(names, true),
    filter: (expr: ast.Expression) => new ast.Filter(expr, true)
};

export const Term = {
    path: (...p: ast.Path ): ast.PathTerm => ({ type: 'path', value: p}),
    some: (...p: ast.Path): ast.PathTerm => ({ type: 'path', value: p, qualifier: 'some'}),
    every: (...p: ast.Path): ast.PathTerm => ({ type: 'path', value: p, qualifier: 'every'}),
    value: (v: any): ast.ValueTerm => ({ type: 'value', value: v }),
};

export const Expr = {
    is: (lhs: ast.Term, rhs: ast.Term) => new ast.BinaryExpression('is', false, lhs, rhs),
    binary: ( op:string, lhs: ast.Term, rhs: ast.Term ) => new ast.BinaryExpression(op, false, lhs, rhs),
    unary: ( op:string, term: ast.Term ) => new ast.UnaryExpression(op, false, term),
    not : {
        is: (lhs: ast.Term, rhs: ast.Term) => new ast.BinaryExpression('is', true, lhs, rhs),
        binary: ( op:string, lhs: ast.Term, rhs: ast.Term ) => new ast.BinaryExpression(op, true, lhs, rhs),
        unary: ( op:string, term: ast.Term ) => new ast.UnaryExpression(op, true, term),
    },
    or: (lhs: ast.Expression, rhs: ast.Expression) => new ast.OrGroup(lhs,rhs),
    and: (lhs: ast.Expression, rhs: ast.Expression) => new ast.AndGroup(lhs,rhs)
};
