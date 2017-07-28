import * as ast from './ast';
import { Matchers, Matcher, Match, MatchPath } from './matcher';

type Operator = (lhs: any, rhs?:any) => boolean;

export interface PathMatcher {
    match: (scopes: any[]) => Match[];
    multi: boolean;
}

export const operators:{[name:string]: Operator} = {
    is : (lhs: any, rhs: any) => {
        if ( lhs === undefined || rhs === undefined ) return false; // Undefined typically means no match. 
        return (lhs === rhs);
    }
};

export const compileValueTerm = (value: any[]) => (scopes: any[]) => value;

export const compilePathTerm = (path: ast.Path): (scopes: any[])=>any => {
    const matcher = compilePath(path);
    
    if ( !matcher.multi ) {
        // For single matches we need to extract the first match value or return undefined when there were no matches. 
        return (scopes: any[]) => {
            const matches = matcher.match(scopes);
            return matches.length > 0 ? matches[0].value : undefined;
        };
    }

    return (scopes: any[]) => matcher.match(scopes).map(m => m.value);
};

export const compileTerm = (term: ast.Term): (scopes: any[])=>any => {
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
        return (scopes:any[]) => !predicate(lhs(scopes));
    }
    return (scopes: any[]) => predicate(lhs(scopes));
};

export const compileBinaryExpression = (expr: ast.BinaryExpression): CompiledExpression => {
    const operator = operators[expr.op];
    const lhs = compileTerm(expr.lhs);
    const rhs = compileTerm(expr.rhs);

    if ( expr.neg ) {
        return (scopes:any[]) => !operator(lhs(scopes), rhs(scopes));
    }
    return (scopes: any[]) => operator(lhs(scopes), rhs(scopes));
};

export const compileOrGroup = (expr: ast.OrGroup): CompiledExpression => {
    const lhs = compileExpression(expr.lhs);
    const rhs = compileExpression(expr.rhs);
    return (scopes:any[]) => lhs(scopes) || rhs(scopes);
};

export const compileAndGroup = (expr: ast.AndGroup): CompiledExpression => {
    const lhs = compileExpression(expr.lhs);
    const rhs = compileExpression(expr.rhs);
    return (scopes:any[]) => lhs(scopes) && rhs(scopes);
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
            return Matchers.all(comp.descendants);
        case 'filter':
            const expr = compileExpression(comp.filter);
            return Matchers.filter(expr, comp.descendants);
        default:
            return Matchers.none(true);
    }
};

