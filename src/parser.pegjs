jpath = root:jp_root? comps:jp_comp* { return root? [root, ...comps] : comps; }

jp_root = '$' { return { type: 'root'}; }

jp_comp 
  = jp_comp_desc
  / jp_comp_child  
  / jp_comp_sub  

jp_comp_desc = '..' name:identifier { return { type: 'descendant', name: name }; }

jp_comp_child = '.' name:identifier { return { type: 'child', name: name }; }

jp_comp_sub = '[' sub:jp_sub ']' { return sub; }

jp_sub 
  = '*' { return { type: 'all' } }
  / jp_slice 
  / i:sint { return { type: 'index', index: i}; }
  / s:qstring { return { type: 'child', name: s}; }

jp_slice = start:sint? ':' end:sint? step:(':' v:sint? { return v || undefined; })? {
    let slice = { type: 'slice' };
    if ( start !== null ) slice.start = start;
    if ( end !== null ) slice.end = end;
    if ( step !== null ) slice.step = step; 
    return slice;
  }

identifier
  = first:[a-zA-Z] next:[a-zA-Z_0-9]* { return first + next.join(''); }

int = '0' / DIGIT_ DIGIT* { return parseInt(text(), 10) }
sint = '-'? int { return parseInt(text(), 10) }


qstring = dquot chars:(dquot_escaped / char / squot)* dquot  { return chars.join('') }
        / squot chars:(squot_escaped / char / dquot)* squot  { return chars.join('') }

char
  = UNESCAPED
  / escape
    c: char_escaped
    { return c; }

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

squot_escaped = escape q:squot { return q } 
dquot_escaped = escape q:dquot { return q }

UNESCAPED 
  = [^\0-\x1F\x22\x5C]

HEXDIG = [0-9a-f]i
DIGIT  = [0-9]
DIGIT_ = [1-9]
