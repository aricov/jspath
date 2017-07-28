import { PathMatcher, CompiledExpression } from './compiler';

export { PathMatcher, CompiledExpression };

export const values = (source: any, path: PathMatcher): any[] => {
    return path.match([source]).map(match => match.value);
};

