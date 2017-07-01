import { PathMatcher } from './matcher';

export { PathMatcher, Match, MatchPath } from './matcher';

export {  CompiledExpression } from './compiler';

export const values = (source: any, path: PathMatcher): any[] => {
    return path.match([source]).map(match => match.value);
};

