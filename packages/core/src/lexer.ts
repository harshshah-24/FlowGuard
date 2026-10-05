import { TOKEN_KINDS } from './contracts.js';
import { SourceFailure, makeDiagnostic } from './diagnostics.js';
import type { BudgetGuard } from './limits.js';
import type { Scalar, SourceSnapshot, Token } from './model.js';
import { buildLineIndex, makeSpan, utf8ByteLength } from './source.js';
type Kind = (typeof TOKEN_KINDS)[number];
const words: Record<string, Kind> = {let:'LET',string:'TYPE_STRING',int:'TYPE_INT',bool:'TYPE_BOOL',if:'IF',else:'ELSE',while:'WHILE',true:'TRUE',false:'FALSE',input:'INPUT',print:'PRINT',sql_query:'SQL_QUERY',sql_bind:'SQL_BIND',shell:'SHELL'};
const operators: Record<string, Kind> = {'&&':'AND','||':'OR','==':'EQ','!=':'NE','<=':'LE','>=':'GE','(':'LPAREN',')':'RPAREN','{':'LBRACE','}':'RBRACE',':':'COLON',';':'SEMICOLON',',':'COMMA','=':'ASSIGN','+':'PLUS','-':'MINUS','*':'STAR','/':'SLASH','%':'PERCENT','!':'BANG','<':'LT','>':'GT'};
export function lex(snapshot: SourceSnapshot, guard: BudgetGuard): Token[] {
 const source=snapshot.source, lines=buildLineIndex(source), tokens:Token[]=[];
 guard.checkpoint('lex',true);
 guard.checkCount('maxSourceBytes',utf8ByteLength(source),'LIMIT_SOURCE','lex');
 let at=source.startsWith('\uFEFF')?1:0;
 const fail=(code:'LEX_INVALID_CHAR'|'LEX_UNTERMINATED_STRING'|'LEX_UNTERMINATED_COMMENT'|'LEX_INVALID_ESCAPE'|'LEX_INTEGER_RANGE',message:string,start:number,end=at)=>{throw new SourceFailure(makeDiagnostic(code,'lex',message,makeSpan(lines,start,end)));};
 const advance=()=>{guard.checkpoint('lex');return source[at++]!;};
 const emit=(kind:Kind,start:number,literal?:Scalar)=>{
  guard.checkCount('maxTokens',tokens.length+1,'LIMIT_TOKENS','lex');
  tokens.push({id:`tok-${tokens.length}`,kind,span:makeSpan(lines,start,at),lexeme:source.slice(start,at),...(literal?{literal}:{})});
 };
 while(at<source.length){
  guard.checkpoint('lex'); const start=at,c=source[at]!;
  if(/[ \t\r\n\v\f]/.test(c)){advance();continue;}
  if(source.startsWith('//',at)){advance();advance();while(at<source.length&&!/[\r\n]/.test(source[at]!))advance();continue;}
  if(source.startsWith('/*',at)){advance();advance();while(at<source.length&&!source.startsWith('*/',at))advance();if(at===source.length)fail('LEX_UNTERMINATED_COMMENT','Block comment must end with */.',start);advance();advance();continue;}
  if(/[A-Za-z_]/.test(c)){advance();while(at<source.length&&/[A-Za-z0-9_]/.test(source[at]!))advance();const word=source.slice(start,at);emit(Object.hasOwn(words,word)?words[word]!:'IDENTIFIER',start);continue;}
  if(/[0-9]/.test(c)){advance();while(at<source.length&&/[0-9]/.test(source[at]!))advance();const value=Number(source.slice(start,at));if(!Number.isInteger(value)||value>2147483647)fail('LEX_INTEGER_RANGE','Integer literal must be between 0 and 2147483647.',start);emit('INTEGER',start,{type:'int',value});continue;}
  if(c==='"'){
   advance();let value='',closed=false;
   while(at<source.length){const ch=advance();if(ch==='"'){closed=true;break;}if(ch==='\r'||ch==='\n')fail('LEX_UNTERMINATED_STRING','Raw line breaks are not allowed in strings.',start);
    if(ch==='\\'){if(at===source.length)break;const escaped=advance();const escapes:Record<string,string>={'"':'"','\\':'\\',n:'\n',r:'\r',t:'\t'};if(!Object.hasOwn(escapes,escaped))fail('LEX_INVALID_ESCAPE','Unsupported string escape.',at-2);value+=escapes[escaped]!;}else value+=ch;
   }
   if(!closed)fail('LEX_UNTERMINATED_STRING','String must end with a double quote.',start);
   emit('STRING',start,{type:'string',value});continue;
  }
  const pair=source.slice(at,at+2);if(pair.length===2&&Object.hasOwn(operators,pair)){advance();advance();emit(operators[pair]!,start);continue;}
  if(Object.hasOwn(operators,c)){advance();emit(operators[c]!,start);continue;}
  advance();fail('LEX_INVALID_CHAR','Unsupported character in source.',start);
 }
 emit('EOF',at);guard.checkpoint('lex',true);return tokens;
}
