import { Match, MatchPath } from './match';
import * as scope from './scope';
import * as named from './named';
import * as all from './all';
import * as filter from './filter';
import * as elements from './elements';

export { Match, MatchPath };

export class Matcher {
    constructor(
        public readonly match: (scopes:any[], source: any) => Match[], 
        public readonly multi:boolean=false
    ){}
}

const MULTI = true;

export const Matchers = {
    root: (index: number) => new Matcher((scopes: any[], source: any) => scope.absolute(scopes, index)),
    relative: (index: number) => new Matcher((scopes: any[], source: any) => scope.relative(scopes, index)),

    all: (descendants: boolean) => descendants ? 
        new Matcher((scopes: any[], source:any) => all.descendants(source), MULTI) :
        new Matcher((scopes: any[], source:any) => all.children(source), MULTI),

    named: (names: string[], descendants: boolean) => descendants ?
        new Matcher((scopes: any[], source: any) => named.descendants(source, names), names.length > 1):
        new Matcher((scopes: any[], source: any) => named.children(source, names), names.length > 1),

    elements: (indices: number[]) => 
        new Matcher((scopes: any[], source: any) => elements.byIndex(source, indices), indices.length > 1),

    slice: (start?: number, end?: number, step?:number) => 
        new Matcher((scopes: any[], source:any) => elements.slice(source, start, end, step), MULTI),

    filter: (flt: (x:any[])=>boolean, descendants: boolean) => descendants ?
        new Matcher((scopes: any[], source: any) => filter.descendants(scopes, source, flt), MULTI):
        new Matcher((scopes: any[], source: any) => filter.children(scopes, source, flt), MULTI),

    none: (multi: boolean) => new Matcher((scopes: any[], source: any) => [], multi)
}
