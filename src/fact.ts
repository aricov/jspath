import * as ast from './ast';
import { MatchPath } from './matcher';
import { Compiler } from './compiler';
import { Operators } from './operators';

export type Extent = 'ancestors' | 'descendants';

export interface Fact {
    name: string;
    context: MatchPath;
    extent?: Extent;
};

export interface Guard {
    name: string;
    not: boolean;
}

export interface Rule {
    name: string; 
    context: ast.Path;
    extent?: Extent;
    guards: Guard[];
    expression?: ast.Expression; 
};

const isSubpath = (path: MatchPath) => ({
    of: (ref: MatchPath) => (ref.length >= path.length) 
        && path.every((elt, index) => ref[index] === elt)
});

const matchFact = (fact: Fact, context: MatchPath): boolean => {
    switch(fact.extent) {
        case 'descendants':
            return isSubpath(context).of(fact.context);
        case 'ancestors':
            return isSubpath(fact.context).of(context);
        default:
            return (fact.context.length === context.length) 
                &&  fact.context.every((elt, index) => context[index] === elt);
    }
};

const matchFacts = (facts: Fact[], context: MatchPath): boolean =>
    facts.some(fact => matchFact(fact, context));

const matchGuard = (guard: Guard, facts: Fact[], context: MatchPath) =>
    guard.not !== matchFacts(facts.filter(fact => fact.name === guard.name), context);

const matchGuards = (guards: Guard[], facts: Fact[], context: MatchPath) =>
    guards.every(guard => matchGuard(guard, facts, context));

export const compileGuards = (guards: Guard[]) => 
    (facts: Fact[], context: MatchPath) => matchGuards(guards, facts, context);

export const compileRule = (rule: Rule, compiler: Compiler) => {
    const compiled = {
        context: compiler.compilePath(rule.context),
        guards: compileGuards(rule.guards),
        expression: compiler.compileExpression(rule.expression)
    };

    return (source: any, facts: Fact[]): Fact[] =>
        compiled.context.match([source])
            .filter(node => compiled.guards(facts, node.path))
            .filter(node => compiled.expression([node.value]))
            .map(node => ({
                name: rule.name,
                context: node.path,
                extent: rule.extent
            }))
            ;
    
};

export const compileRules = (rules: Rule[], operators:Operators = {}) => {
    const compiler = Compiler(operators);
    const compiled = rules.map(rule => compileRule(rule, compiler));
    return (source: any, initialFacts: Fact[]): Fact[] => {
        return compiled.reduce(
            (facts, rule) => [...facts, ...rule(source, facts)],
            initialFacts
        );
    };
};