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
  / path_current
  / path_relative

path_absolute = '$' comps:path_comp* { return [new ast.Root(), ...comps]; }
path_current  = '@' comps:path_comp* { return [new ast.Current(), ...comps]; }
path_relative = '^'? comps:path_comp+ { return comps; }

expr = expr_or

/*
 * Path structure
 */
path_root = '$' { return { type: 'root'}; }

path_comp 
  = path_comp_desc
  / path_comp_child 
  / path_comp_sub

path_comp_desc = '..' name:identifier { return new ast.Descendant(name); }

path_comp_child = '.' name:identifier { return new ast.Child(name); }

path_comp_sub = '[' _ sub:path_sub _ ']' { return sub; }


path_sub 
  = '*' { return new ast.All(); }
  / s:slice { return new ast.Slice(s.start, s.end, s.step); } 
  / l:sint_list { return new ast.Elements(l); }
  / i:sint { return new ast.Element(i); }
  / l:name_list { return new ast.Children(l); }
  / '[' _ s:qstring _ ']' { return new ast.Descendant(s); }
  / '[' _ l:name_list _ ']' { return new ast.Descendants(l); }
  / s:qstring { return new ast.Child(s); }
  / '?' __ expr:expr_or { return {type: 'filter', expr}; }

slice
  = start:sint? ':' end:sint? step:(':' v:sint? { return v || undefined; })? {
    const s = {};
    if ( start !== null ) s.start = start;
    if ( end !== null ) s.end = end;
    if ( step !== null ) s.step = step;
    return s;
  }

sint_list 
  = head:sint tail:( _ ',' _ i:sint {return i})+ {
    return  [head, ...tail];
  }

name_list 
  = head:qstring tail:( _ ',' _ n:qstring {return n})+ {
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
  = '`'? v:value { return new ast.ValueTerm(v); }
  / p:path_current { return new ast.PathTerm(p); }
  / p:path_absolute { return new ast.PathTerm(p); }
  / p:path_relative { return new ast.PathTerm(p); }

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
