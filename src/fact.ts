import * as ast from './ast';
import { MatchPath } from './matcher';
import { compiler } from './compiler';

export type Extent = 'ancestors' | 'descendants';

export interface Fact {
    name: string;
    context: MatchPath;
    extent?: Extent;
};

export interface Rule {
    name: string; 
    context: ast.Path;
    extent?: Extent;
    guards: string[];
    expression?: ast.Expression; 
};

const isSubpath = (path: MatchPath) => ({
    of: (ref: MatchPath) => (ref.length >= path.length) 
        && path.every((elt, index) => ref[index] === elt)
});

export const matchFact = (fact: Fact, context: MatchPath): boolean => {
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

export const matchFacts = (facts: Fact[], context: MatchPath): boolean => {
    return facts.some(fact => matchFact(fact, context));
};

export const matchGuards = (guards: string[], facts: Fact[], context: MatchPath) => {
    return guards.every(guard => matchFacts(facts.filter(fact => fact.name === guard), context));
};

export const compileGuards = (guards: string[]) => (facts: Fact[], context: MatchPath) => matchGuards(guards, facts, context);

export const compileRule = (rule: Rule) => {
    const { compilePath, compileExpression } = compiler();
    const compiled = {
        context: compilePath(rule.context),
        guards: compileGuards(rule.guards),
        expression: compileExpression(rule.expression)
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

export const compileRules = (rules: Rule[]) => {
    const compiled = rules.map(compileRule);
    return (source: any, initialFacts: Fact[]): Fact[] => {
        return compiled.reduce(
            (facts, rule) => [...facts, ...rule(source, facts)],
            initialFacts
        );
    };
};