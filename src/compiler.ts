import * as ast from './ast';
import { Matchers, Matcher, Match, MatchPath } from './matcher';
import { Operators, builtin  } from './operators';

export interface PathMatcher {
    match: (scopes: any[]) => Match[];
    multi: boolean;
}

export interface CompiledTerm {
    type: 'path' | 'value';
    qualifier? : ast.PathQualifier;
    value: (scopes: any[]) => any;
};

export type CompiledExpression = (scopes: any[]) => boolean;

const asArray = (value: any): any[] => {
    return Array.isArray(value) ? value : [];
};

const prepend = (path: MatchPath) => (match: Match) => ({
    path : [...path, ...match.path],
    value: match.value
});

export interface Compiler {
    compilePath: (path: ast.Path) => PathMatcher;
    compileExpression: (expr: ast.Expression) => CompiledExpression;
};

export const Compiler = (custom: Operators = {}): Compiler => {
    const operators = {...builtin, ...custom }; 

    const compileValueTerm = (value: any[]) => (scopes: any[]) => value;

    const compilePathTerm = (path: ast.Path): (scopes: any[])=>any => {
    
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

    const compileTerm = (term: ast.Term): CompiledTerm => {
        switch ( term.type ) {
            case 'path': return { ...term, value: compilePathTerm(term.value)};
            case 'value': return { ...term, value: compileValueTerm(term.value)};
        }
    };

    const compileUnaryExpression = (expr: ast.UnaryExpression): CompiledExpression => {
        const operator = operators[expr.op];
        const predicate = expr.neg ? (p: any) => !operator(p) : operator;

        const lhs = compileTerm(expr.lhs);
        switch ( lhs.qualifier ) {
            case 'some': return (scopes: any[]) => asArray(lhs.value(scopes)).some(predicate);
            case 'every': return (scopes: any[]) => asArray(lhs.value(scopes)).every(predicate);
            default: return (scopes: any[]) => predicate(lhs.value(scopes)); 
        }
    };

    const compileBinaryExpression = (expr: ast.BinaryExpression): CompiledExpression => {
        const operator = operators[expr.op];
        const predicate = expr.neg ? (p: any) => !operator(p) : operator;
        
        const lhs = compileTerm(expr.lhs);
        const rhs = compileTerm(expr.rhs);

        switch( lhs.qualifier ) {
            case 'some': switch ( rhs.qualifier ) {
                case 'some': return (scopes: any[]) => {
                    const left = asArray(lhs.value(scopes));
                    const right = asArray(rhs.value(scopes));
                    return left.some(l => right.some(r => predicate(l,r)));
                };
                case 'every': return (scopes: any[]) => {
                    const left = asArray(lhs.value(scopes));
                    const right = asArray(rhs.value(scopes));
                    return left.some(l => right.every(r => predicate(l,r)));
                };
                default : return (scopes: any[]) => {
                    const left = asArray(lhs.value(scopes));
                    const right = rhs.value(scopes);
                    return left.some(l => predicate(l,right));
                }; 
            }

            case 'every': switch ( rhs.qualifier ) {
                case 'some': return (scopes: any[]) => {
                    const left = asArray(lhs.value(scopes));
                    const right = asArray(rhs.value(scopes));
                    return left.every(l => right.some(r => predicate(l,r)));
                };
                case 'every': return (scopes: any[]) => {
                    const left = asArray(lhs.value(scopes));
                    const right = asArray(rhs.value(scopes));
                    return left.every(l => right.every(r => predicate(l,r)));
                };
                default : return (scopes: any[]) => {
                    const left = asArray(lhs.value(scopes));
                    const right = rhs.value(scopes);
                    return left.every(l => predicate(l,right));
                }; 
            }
                
            default: switch ( rhs.qualifier ) {
                case 'some': return (scopes: any[]) => {
                    const left = lhs.value(scopes);
                    const right = asArray(rhs.value(scopes));
                    return right.some(r => predicate(left,r));
                };
                case 'every': return (scopes: any[]) => {
                    const left = lhs.value(scopes);
                    const right = asArray(rhs.value(scopes));
                    return right.every(r => predicate(left,r));
                };
                default : return (scopes: any[]) => {
                    const left = lhs.value(scopes);
                    const right = rhs.value(scopes);
                    return predicate(left, right);
                }; 
            }
        }        
    };

    const compileOrGroup = (expr: ast.OrGroup): CompiledExpression => {
        const lhs = compileExpression(expr.lhs);
        const rhs = compileExpression(expr.rhs);
        return (scopes:any[]) => lhs(scopes) || rhs(scopes);
    };

    const compileAndGroup = (expr: ast.AndGroup): CompiledExpression => {
        const lhs = compileExpression(expr.lhs);
        const rhs = compileExpression(expr.rhs);
        return (scopes:any[]) => lhs(scopes) && rhs(scopes);
    };

    const compileExpression = (expr: ast.Expression): CompiledExpression => {
        switch ( expr.type ) {
            case 'or': return compileOrGroup(expr);
            case 'and': return compileAndGroup(expr);
            case 'unary': return compileUnaryExpression(expr);
            case 'binary': return compileBinaryExpression(expr);
        }
    };
    
    const compilePath = (path: ast.Path): PathMatcher => {
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

    const compileComponent = (comp: ast.Component): Matcher => {
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
                const expr = compileExpression(comp.expr);
                return Matchers.filter(expr, comp.descendants);
            default:
                return Matchers.none(true);
        }
    };

    return {
        compilePath,
        compileExpression
    };

};


