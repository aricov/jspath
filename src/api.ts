import * as parser from './parser';
import { Path } from './ast';
import { matcher, Match } from './match';

export const compile = (path: string) => matcher(parser.parse(path) as Path);

export const match = (source: any, path: string): Match[] => {
    const matchFn = compile(path);
    return matchFn(source);
};

export const values = (source: any, path: string): any[] => {
    return match(source, path).map(match => match.value);
};


