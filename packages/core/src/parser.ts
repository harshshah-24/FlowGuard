import { preorder } from './ast.js';
import { SourceFailure, makeDiagnostic } from './diagnostics.js';
import type { BudgetGuard } from './limits.js';
import type { AstNode, Block, Expression, Program, ScalarType, SourceSnapshot, Statement, Token } from './model.js';
import { buildLineIndex, makeSpan } from './source.js';
type Kind=Token['kind'];
const levels:Partial<Record<Kind,number>>={OR:1,AND:2,EQ:3,NE:3,LT:4,LE:4,GT:4,GE:4,PLUS:5,MINUS:5,STAR:6,SLASH:6,PERCENT:6};
export class Parser {
 private at=0;private depth=0;private count=0;private readonly lines:ReturnType<typeof buildLineIndex>;
 constructor(private readonly tokens:Token[],private readonly snapshot:SourceSnapshot,private readonly guard:BudgetGuard){this.lines=buildLineIndex(snapshot.source);}
 private get token():Token{return this.tokens[this.at]??this.tokens[this.tokens.length-1]!;}
 private take():Token{this.guard.checkpoint('parse');return this.tokens[this.at++]!;}
 private is(kind:Kind){return this.token.kind===kind;}
 private expect(kind:Kind):Token{if(!this.is(kind))this.fail(`Expected ${kind}, found ${this.token.kind}.`);return this.take();}
 private fail(message:string):never{throw new SourceFailure(makeDiagnostic('PARSE_EXPECTED','parse',message,this.token.span));}
 private span(start:number,end:number){return makeSpan(this.lines,start,end);}
 private node<T extends AstNode>(value:T):T{this.guard.checkCount('maxAstNodes',++this.count,'LIMIT_AST','parse');return value;}
 private nested<T>(fn:()=>T):T{this.guard.checkCount('maxNesting',++this.depth,'LIMIT_NESTING','parse');try{return fn();}finally{this.depth--;}}
 parseProgram():Program{
  this.guard.checkpoint('parse',true);const statements:Statement[]=[];while(!this.is('EOF'))statements.push(this.statement());
  const program=this.node<Program>({id:'',kind:'Program',span:this.span(0,this.snapshot.source.length),statements});
  for(const [index,node] of preorder(program).entries()){this.guard.checkpoint('parse');node.id=`ast-${index}`;}
  this.guard.checkpoint('parse',true);return program;
 }
 private block():Block{return this.nested(()=>{const start=this.expect('LBRACE').span.start,statements:Statement[]=[];while(!this.is('RBRACE')){if(this.is('EOF'))this.fail('Expected closing brace.');statements.push(this.statement());}return this.node<Block>({id:'',kind:'Block',span:this.span(start,this.take().span.end),statements});});}
 private condition():Expression{return this.nested(()=>{this.expect('LPAREN');const expression=this.expression();this.expect('RPAREN');return expression;});}
 private statement():Statement{
  const start=this.token.span.start;
  if(this.is('LBRACE'))return this.block();
  if(this.is('LET')){this.take();const name=this.expect('IDENTIFIER');this.expect('COLON');const types:Partial<Record<Kind,ScalarType>>={TYPE_STRING:'string',TYPE_INT:'int',TYPE_BOOL:'bool'};const type=types[this.token.kind];if(!type)this.fail('Expected string, int, or bool type.');this.take();this.expect('ASSIGN');const initializer=this.expression();const end=this.expect('SEMICOLON').span.end;return this.node<Statement>({id:'',kind:'Declaration',span:this.span(start,end),name:name.lexeme,nameSpan:name.span,type,initializer});}
  if(this.is('IDENTIFIER')){const target=this.take();this.expect('ASSIGN');const value=this.expression();const end=this.expect('SEMICOLON').span.end;return this.node<Statement>({id:'',kind:'Assignment',span:this.span(start,end),target:target.lexeme,targetSpan:target.span,value});}
  if(this.is('IF')){this.take();const condition=this.condition(),then=this.block();let optionalElse:Block|undefined;if(this.is('ELSE')){this.take();optionalElse=this.block();}return this.node<Statement>({id:'',kind:'If',span:this.span(start,(optionalElse??then).span.end),condition,then,...(optionalElse?{optionalElse}:{})});}
  if(this.is('WHILE')){this.take();const condition=this.condition(),body=this.block();return this.node<Statement>({id:'',kind:'While',span:this.span(start,body.span.end),condition,body});}
  if(['PRINT','SQL_QUERY','SQL_BIND','SHELL'].includes(this.token.kind)){const name=this.take().lexeme as 'print'|'sql_query'|'sql_bind'|'shell';this.expect('LPAREN');const args:Expression[]=[];if(!this.is('RPAREN')){args.push(this.expression());while(this.is('COMMA')){this.take();args.push(this.expression());}}this.expect('RPAREN');const end=this.expect('SEMICOLON').span.end;return this.node<Statement>({id:'',kind:'EffectCall',span:this.span(start,end),name,args});}
  return this.fail('Expected a declaration, assignment, effect, block, if, or while.');
 }
 private expression(min=1):Expression{
  let left=this.unary();while((levels[this.token.kind]??0)>=min){const operator=this.take(),rank=levels[operator.kind]!;const right=this.expression(rank+1);left=this.node<Expression>({id:'',kind:'Binary',span:this.span(left.span.start,right.span.end),op:operator.lexeme as Extract<Expression,{kind:'Binary'}>['op'],left,right});}return left;
 }
 private unary():Expression{
  if(this.is('MINUS')||this.is('BANG'))return this.nested(()=>{const operator=this.take(),operand=this.unary();return this.node<Expression>({id:'',kind:'Unary',span:this.span(operator.span.start,operand.span.end),op:operator.lexeme as '-'|'!',operand});});
  return this.primary();
 }
 private primary():Expression{
  const token=this.token;
  if(this.is('INTEGER')||this.is('STRING')){this.take();return this.node<Expression>({id:'',kind:'Literal',span:token.span,scalar:token.literal!});}
  if(this.is('TRUE')||this.is('FALSE')){this.take();return this.node<Expression>({id:'',kind:'Literal',span:token.span,scalar:{type:'bool',value:token.kind==='TRUE'}});}
  if(this.is('IDENTIFIER')){this.take();return this.node<Expression>({id:'',kind:'Variable',span:token.span,name:token.lexeme});}
  if(this.is('LPAREN'))return this.nested(()=>{this.take();const expression=this.expression();const end=this.expect('RPAREN').span.end;expression.span=this.span(token.span.start,end);return expression;});
  if(this.is('INPUT'))return this.nested(()=>{this.take();this.expect('LPAREN');const prompt=this.expression();this.expect('RPAREN');return this.node<Expression>({id:'',kind:'InputCall',span:this.span(token.span.start,this.tokens[this.at-1]!.span.end),prompt});});
  return this.fail('Expected a value expression.');
 }
}
export function parse(tokens:Token[],snapshot:SourceSnapshot,guard:BudgetGuard):Program{return new Parser(tokens,snapshot,guard).parseProgram();}
