{
  function setEntry(object, entry) {
    object[entry.key] = entry.val;
    return object;
  }
}

/*
 * Starting rules 
 */
path 
  = path_absolute
  / path_relative
  / path_current

path_absolute = scope:absolute_scope comps:path_comp* { return [scope, ...comps]; }
path_relative = scope:relative_scope comps:path_comp* { return [scope, ...comps]; }
path_current  
  = '@' comps:path_comp* { return [new ast.RelativeScope(0), ...comps]; }
  / &'.' comps:path_comp* { return [new ast.RelativeScope(0), ...comps]; } 
  // Testing for the dot before attempting to match a non-scoped relative path removes the ambiguity with values,
  // as values cannot start with '.' but may very well start with '['].

expr = expr_or

/*
 * Path structure
 */
absolute_scope = '$' scope_index:(int)? { return new ast.RootScope(scope_index || 0 ); } 
relative_scope = '^' scope_index:(int)? { return new ast.RelativeScope(scope_index || 1 ); } 

path_comp 
  = path_comp_simple_desc
  / path_comp_simple_child 
  / path_comp_canon_desc
  / path_comp_canon_child

path_comp_simple_desc = '..' name:identifier { return new ast.Named([name], true); }

path_comp_simple_child = '.' name:identifier { return new ast.Named([name]); }

path_comp_canon_desc = '[[' _ spec:path_spec_desc _ ']]' { return spec; }

path_comp_canon_child = '[' _ spec:path_spec_child _']' { return spec; }

path_spec_child
  = '*' { return new ast.All(); }
  / s:slice { return new ast.Slice(s.start, s.end, s.step); } 
  / l:sint_list { return new ast.Elements(l); }
  / l:name_list { return new ast.Named(l); }
  / '?' __ expr:expr_or { return {type: 'filter', expr, descendants: false}; }

path_spec_desc
  = '*' { return new ast.All(true); }
  / _ l:name_list _ { return new ast.Named(l, true); }
   / '?' __ expr:expr_or { return {type: 'filter', expr, descendants: true}; }

slice
  = start:sint? ':' end:sint? step:(':' v:sint? { return v || undefined; })? {
    const s = {};
    if ( start !== null ) s.start = start;
    if ( end !== null ) s.end = end;
    if ( step !== null ) s.step = step;
    return s;
  }

sint_list 
  = head:sint tail:( _ ',' _ i:sint {return i})* {
    return  [head, ...tail];
  }

name_list 
  = head:qstring tail:( _ ',' _ n:qstring {return n})* {
    return [head, ...tail]; 
  }

/* Filter expression */

expr_or
  = left:expr_and __ OR __ right:expr_or {
    return {
      type: 'or',
      lhs: left,
      rhs: right
    };
  }
  / expr_and

expr_and
  = lhs:expr_bool __ AND __  rhs:expr_and {
    return new ast.AndGroup(lhs, rhs);
  }
  / expr_bool

expr_bool
  = expr_simple
  / '(' _ grp:expr_or _ ')' { return grp; }

expr_simple
  = neg:'not 'i? lhs:expr_term __ op:identifier rhs:(__ t:expr_term { return t; })? {
    return rhs !== null
      ? new ast.BinaryExpression(
        op,
        neg!==null,
        lhs,
        rhs
      )
      : new ast.UnaryExpression(
        op,
        neg!==null,
        lhs
      );
  }
 
expr_term
  = p:path { return new ast.PathTerm(p); } 
  / '`'? v:value { return new ast.ValueTerm(v); }

OR = 'or'i
AND = 'and'i

operator 
  = 'is' { return text(); }
  / 'in' { return text(); }


/* Values */
value 
  = boolean
  / number
  / qstring
  / val_array
  / val_object

val_object "object value"
  = '{'_ seq:entry_seq _ '}' { return seq.reduce(setEntry, {}); }
  / '{' _ ent:entry _ '}' { return setEntry({}, ent); }
  / '{' _ '}' { return {}; }

entry_seq 
  = head:entry tail:( _ ',' _ e:entry { return e; })+ { 
    return [head, ...tail];
  }

entry 
  = key:(qstring / identifier) _ ':' _ val:value { 
    return {
      key: key,
      val: val
    };
  } 

val_array "array value"
  = '[' _ seq:value_seq _ ']' { return seq; }
  / '[' _ val:value _ ']' { return [val]; }
  / '[' _ ']' { return []; }

value_seq 
  = head:value tail:(',' e:value { return e;})+ {
    return [head, ...tail];
  }

/* Scalars */
boolean "boolean"
  = 'true' { return true; }
  / 'false' { return false; }

number "number"
  = '-'? int frac? exp? { return parseFloat(text()); }


int = '0' / DIGIT_ DIGIT* { return parseInt(text(), 10) }
sint = '-'? int { return parseInt(text(), 10) }

frac = '.' DIGIT+;
exp = E ( '-' / '+' ) DIGIT+;

name = identifier / qstring;

identifier "identifer"
  = first:[a-zA-Z] next:[a-zA-Z_0-9]* { return first + next.join(''); }

qstring "string"
  = dquot chars:(dquot_escaped / char / squot)* dquot  {
    return chars.join('');
  }
  / squot chars:(squot_escaped / char / dquot)* squot  { 
    return chars.join('');
  }

char
  = UNESCAPED
  / escape 
    c: char_escaped { return c; }

escape = '\\'

char_escaped "escape sequence"
    =  '\\'
    / '/'
    / 'b' { return '\b'; }
    / 'f' { return '\f'; }
    / 'n' { return '\n'; }
    / 'r' { return '\r'; }
    / 't' { return '\t'; }
    / 'u' digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
    }

squot = "'"
dquot = '"'

squot_escaped = escape q:squot { return q; } 
dquot_escaped = escape q:dquot { return q; }

UNESCAPED 
  = [^\0-\x1F\x22\x5C]

E = [eE]
HEXDIG = [0-9a-f]i
DIGIT  = [0-9]
DIGIT_ = [1-9]

/* Whitespace */
_ = [ \t]*
__ = [ \t]+
