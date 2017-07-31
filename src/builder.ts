import * as ast from './ast';

export const Scope = {
    absolute: (index?: number): ast.RootScope => ({ type: 'root', index: index || 0}),
    relative: (index?: number): ast.RelativeScope => ({ type: 'relative', index:index || 0})
};

export const $:ast.RootScope = Scope.absolute(0);
export const _:ast.RelativeScope = Scope.relative(0);

export const Child = {
    all: { type: 'all', descendants: false} as ast.All,
    named: (...names:string[]):ast.Named => ({ type:'named', names, descendants: false}),
    at: (...indices:number[]): ast.Elements => ({ type:'elements', indices}),
    slice: (start:number=0, end:number=Infinity, step:number=1): ast.Slice => ({ type: 'slice', start, end, step}),
    filter: (expr: ast.Expression): ast.Filter => ({ type: 'filter', expr, descendants: false})
};

export const Desc = {
    all: { type: 'all', descendants: true} as ast.All,
    named: (...names:string[]): ast.Named => ({ type: 'named', names, descendants: true}),
    filter: (expr: ast.Expression): ast.Filter => ({ type: 'filter', expr, descendants: true})
};

export const Term = {
    path: (...p: ast.Path ): ast.PathTerm => ({ type: 'path', value: p}),
    some: (...p: ast.Path): ast.PathTerm => ({ type: 'path', value: p, qualifier: 'some'}),
    every: (...p: ast.Path): ast.PathTerm => ({ type: 'path', value: p, qualifier: 'every'}),
    value: (v: any): ast.ValueTerm => ({ type: 'value', value: v }),
};

export const Expr = {
    is: (lhs: ast.Term, rhs: ast.Term) => Expr.binary('is', lhs, rhs),
    binary: ( op:string, lhs: ast.Term, rhs: ast.Term ):ast.BinaryExpression => ({type: 'binary', op, neg:false, lhs, rhs}),
    unary: ( op:string, term: ast.Term ):ast.UnaryExpression => ({type: 'unary', op, neg:false, lhs:term}),
    not : {
        is: (lhs: ast.Term, rhs: ast.Term):ast.BinaryExpression => Expr.not.binary('is', lhs, rhs),
        binary: ( op:string, lhs: ast.Term, rhs: ast.Term ):ast.BinaryExpression => ({type: 'binary', op, neg:true, lhs, rhs}),
        unary: ( op:string, term: ast.Term ):ast.UnaryExpression => ({type: 'unary', op, neg:true, lhs:term}),
    },
    or: (lhs: ast.Expression, rhs: ast.Expression):ast.OrGroup => ({type: 'or', lhs,rhs}),
    and: (lhs: ast.Expression, rhs: ast.Expression):ast.AndGroup => ({type:'and',lhs,rhs})
};
