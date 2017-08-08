import * as ast from './ast';
import * as parser from './parser';
import { Operators } from './operators';
import { PathMatcher, CompiledExpression, Compiler } from './compiler';

export { PathMatcher, CompiledExpression };

export const Path = {

    parse: (expression: string) => {
        const ast = parser.parse(expression) as ast.Path;
        return {
            ast,
            compile: (operators: Operators = {}) => {
                const matcher = Compiler(operators).compilePath(ast);
                return {
                    matches: (source: any) => matcher.match([source]),
                    values: (source: any) => matcher.match([source]).map(m => m.value),
                    value: (source: any) => matcher.match([source]).reduce((v:any, m) => (v === undefined ? m.value : v), undefined)
                };
            }
        };
    },

    compile: (expression: string, operators: Operators = {}) => Path.parse(expression).compile(operators)
};

export const Expression = {

    parse: (expression: string) => {
        const ast = parser.parse(expression, {startRule:'expr'});
        return {
            ast,
            compile: (operators: Operators = {}) => {
                const expr = Compiler(operators).compileExpression(ast);
                return {
                    test: (source: any) => expr([source])
                };
            }
        };
    },

    compile: (expression: string, operators:Operators = {}) => Expression.parse(expression).compile(operators),

    test: (expression: string, source: any, operators:Operators = {}) => Expression.compile(expression, operators).test(source)
};
