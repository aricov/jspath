import { Matcher } from './matcher';

export { Matcher, Match, MatchPath } from './matcher';

export {  CompiledExpression } from './compiler';

export const values = (source: any, path: Matcher): any[] => {
    return path.match(source).map(match => match.value);
};

