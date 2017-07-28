import * as ast from './ast';
import * as parser from './parser';
import { PathMatcher, CompiledExpression, compilePath, compileExpression } from './compiler';

export { PathMatcher, CompiledExpression };

export const Path = {

    parse: (expression: string) => {
        const ast = parser.parse(expression) as ast.Path;
        return {
            ast,
            compile: () => {
                const matcher = compilePath(ast);
                return {
                    matches: (source: any) => matcher.match([source]),
                    values: (source: any) => matcher.match([source]).map(m => m.value),
                    value: (source: any) => matcher.match([source]).reduce((v:any, m) => (v === undefined ? m.value : v), undefined)
                };
            }
        };
    },

    compile: (expression: string) => Path.parse(expression).compile()
};

export const Expression = {

    parse: (expression: string) => {
        const ast = parser.parse(expression, {startRule:'expr'});
        return {
            ast,
            compile: () => {
                const expr = compileExpression(ast);
                return {
                    test: (source: any) => expr([source])
                };
            }
        };
    },

    compile: (expression: string) => Expression.parse(expression).compile(),

    test: (expression: string, source: any) => Expression.compile(expression).test(source)
};
