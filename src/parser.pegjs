jpath = root:jp_root? comps:jp_comp* { return root? [root, ...comps] : comps; }

jp_root = '$' { return { type: 'root'}; }

jp_comp 
  = jp_comp_desc
  / jp_comp_child  
  / jp_comp_sub  

jp_comp_desc = '..' name:identifier { return { type: 'descendant', name: name }; }

jp_comp_child = '.' name:identifier { return { type: 'child', name: name }; }

jp_comp_sub = '[' _ sub:jp_sub _ ']' { return sub; }

jp_sub 
  = '*' { return { type: 'all' } }
  / s:slice { return { type: 'slice', ...s}; } 
  / l:sint_list { return { type: 'elements', indices: l}; }
  / i:sint { return { type: 'element', index: i}; }
  / l:jp_name_list { return {type: 'children', names: l}; }
  / '[' _ s:qstring _ ']' { return {type: 'descendant', name:s}; }
  / '[' _ l:jp_name_list _ ']' { return {type: 'descendants', names: l }; }
  / s:qstring { return { type: 'child', name: s}; }

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

jp_name_list 
  = head:qstring tail:( _ ',' _ n:qstring {return n})+ {
    return [head, ...tail]; 
  }

int = '0' / DIGIT_ DIGIT* { return parseInt(text(), 10) }
sint = '-'? int { return parseInt(text(), 10) }

jp_name = identifier / qstring;

identifier
  = first:[a-zA-Z] next:[a-zA-Z_0-9]* { return first + next.join(''); }

qstring = dquot chars:(dquot_escaped / char / squot)* dquot  { return chars.join('') }
        / squot chars:(squot_escaped / char / dquot)* squot  { return chars.join('') }

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

squot_escaped = escape q:squot { return q } 
dquot_escaped = escape q:dquot { return q }

UNESCAPED 
  = [^\0-\x1F\x22\x5C]

HEXDIG = [0-9a-f]i
DIGIT  = [0-9]
DIGIT_ = [1-9]

_ = [ \t]*
