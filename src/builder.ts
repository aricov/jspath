import * as ast from './ast';

export const $ = new ast.RootScope(0);
export const _ = new ast.RelativeScope(0);

export const Child = {
    all: new ast.All(false),
    named: (...names:string[]) => new ast.Named(names, false),
    at: (...indices:number[]) => new ast.Elements(indices),
    filter: (expr: ast.Expression) => new ast.Filter(expr, false)
};

export const Desc = {
    all: new ast.All(true),
    named: (...names:string[]) => new ast.Named(names, true),
    filter: (expr: ast.Expression) => new ast.Filter(expr, true)
};

export const Expr = {
    is: (lhs: ast.Term, rhs: ast.Term) => new ast.BinaryExpression('is', false, lhs, rhs),
    path: (...p: ast.Path ) => new ast.PathTerm(p),
    value: (v: any) => new ast.ValueTerm(v),
    not : {
        is: (lhs: ast.Term, rhs: ast.Term) => new ast.BinaryExpression('is', true, lhs, rhs),
    },
    or: (lhs: ast.Expression, rhs: ast.Expression) => new ast.OrGroup(lhs,rhs),
    and: (lhs: ast.Expression, rhs: ast.Expression) => new ast.AndGroup(lhs,rhs)
};