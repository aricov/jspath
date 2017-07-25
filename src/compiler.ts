import * as ast from './ast';
import { Matchers, PathMatcher, Matcher, Match, MatchPath } from './matcher';

type Operator = (lhs: any, rhs?:any) => boolean;

const operators:{[name:string]: Operator} = {};

export const compileValueTerm = (value: any) => (source: any) => value;

export const compilePathTerm = (path: ast.Path) => {
    const matcher = compilePath(path);
    
    if ( !matcher.multi ) {
        // For single matches we need to extract the first match value or return udefined when there were no matches. 
        return (source: any) => {
            const matches = matcher.match(source);
            return matches.length > 0 ? matches[0] : undefined;
        };
    }

    return (source: any) => matcher.match(source).map(m => m.value);
};

export const compileTerm = (term: ast.Term) => (source: any): any => {
    switch ( term.type ) {
        case 'path': return compilePathTerm(term.value);
        case 'value': return compileValueTerm(term.value);
    }
};

export type CompiledExpression = (scopes: any[]) => boolean;

export const negate = (expr: CompiledExpression): CompiledExpression  => {
    return (scopes: any[]) => !expr(scopes);
};

export const compileUnaryExpression = (expr: ast.UnaryExpression): CompiledExpression => {
    const predicate = operators[expr.op];
    const lhs = compileTerm(expr.lhs);
    if ( expr.neg ) {
        return (source:any) => !predicate(lhs(source));
    }
    return (source: any) => predicate(lhs(source));
};

export const compileBinaryExpression = (expr: ast.BinaryExpression): CompiledExpression => {
    const operator = operators[expr.op];
    const lhs = compileTerm(expr.lhs);
    const rhs = compileTerm(expr.rhs);
    if ( expr.neg ) {
        return (source:any) => !operator(lhs(source), rhs(source));
    }
    return (source: any) => operator(lhs(source), rhs(source));
};

export const compileOrGroup = (expr: ast.OrGroup): CompiledExpression => {
    const lhs = compileExpression(expr.lhs);
    const rhs = compileExpression(expr.rhs);
    return (source:any) => lhs(source) || rhs(source);
};

export const compileAndGroup = (expr: ast.AndGroup): CompiledExpression => {
    const lhs = compileExpression(expr.lhs);
    const rhs = compileExpression(expr.rhs);
    return (source:any) => lhs(source) && rhs(source);
};

export const compileExpression = (expr: ast.Expression): CompiledExpression => {
    switch ( expr.type ) {
        case 'or': return compileOrGroup(expr);
        case 'and': return compileAndGroup(expr);
        case 'unary': return compileUnaryExpression(expr);
        case 'binary': return compileBinaryExpression(expr);
    }
};

export const prepend = (path: MatchPath) => (match: Match) => ({
    path : [...path, ...match.path],
    value: match.value
});

export const compilePath = (path: ast.Path): PathMatcher => {
    const compiledPath: Matcher[] = path.map(compileComponent);
    const multi = compiledPath.reduce((multi, matcher) => multi || matcher.multi, false);

    const matchFn = (scopes: any[]): Match[] => {
        if ( scopes.length < 1) return [];

        // This is probably useless, and we could directly iterate over all components.
        // It helps understanding what's going on a bit better though,
        // because the first path component is special in that it must be a scope component.
        const scopeMatch = compiledPath[0].match(scopes, undefined)[0];
        if ( scopeMatch.value === undefined ) return [];
        const compiledComponents = compiledPath.slice(1);

        return compiledComponents.reduce(
            (matches, compiledComponent): Match[] => {
                return matches.reduce(
                    (previous: Match[], match: Match): Match[] => [
                        ...previous, 
                        ...compiledComponent.match(scopes, match.value).map(prepend(match.path))
                    ], 
                    []
                );
            },
            [scopeMatch]);
    };

    return { match: matchFn, multi};
};

export const compileComponent = (comp: ast.Component): Matcher => {
    switch ( comp.type ) {
        case 'root' : 
            return Matchers.root(comp.index);
        case 'relative':
            return Matchers.relative(comp.index);
        case 'named':
            return Matchers.named(comp.names, comp.descendants);
        case 'elements':
            return Matchers.elements(comp.indices);
        case 'slice':
            return Matchers.slice(comp.start, comp.end, comp.step);
        case 'all':
            return Matchers.all;
        case 'filter':
            const expr = compileExpression(comp.filter);
            return Matchers.filter(expr);
        default:
            return Matchers.none(true);
    }
};

