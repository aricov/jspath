import { Path } from './ast';
import * as parser from './parser';
import { matcher, Match } from './matcher';

export { Match };

export const compile = (path: string) => matcher(parser.parse(path) as Path);

export const match = (source: any, path: string): Match[] => {
    const matchFn = compile(path);
    return matchFn(source);
};

export const values = (source: any, path: string): any[] => {
    return match(source, path).map(match => match.value);
};

