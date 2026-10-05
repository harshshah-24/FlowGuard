import { describe,it,expect } from 'vitest';
import { ProgramSchema, boundary } from '../src/contracts.js';
import { preorder } from '../src/ast.js';
import { lex } from '../src/lexer.js';
import { parse } from '../src/parser.js';
import { LimitFailure,SourceFailure } from '../src/diagnostics.js';
import { snapshot,guard } from './frontend-helper.js';
const program=(source:string)=>{const s=snapshot(source);return parse(lex(s,guard()),s,guard());};
describe('parser',()=>{
 it('builds all statement variants and preorder IDs',()=>{const ast=program('let n: int = 1; { n = n + 1; } if (true) {print(n);} else {shell("x");} while (false) {sql_bind("?", n);}');expect(ast.statements.map(s=>s.kind)).toEqual(['Declaration','Block','If','While']);expect(preorder(ast).map(n=>n.id)).toEqual(preorder(ast).map((_,i)=>`ast-${i}`));});
 it('preserves precedence, left binary association, and right unary association',()=>{const ast=program('print(1 - 2 - 3 * 4 == 0 || !false && true);');const statement=ast.statements[0]!;if(statement.kind!=='EffectCall')throw Error();const root=statement.args[0]!;expect(root).toMatchObject({kind:'Binary',op:'||',left:{op:'==',left:{op:'-',left:{op:'-'},right:{op:'*'}}},right:{op:'&&',left:{op:'!'}}});expect(program('print(- - 1);').statements[0]).toMatchObject({args:[{op:'-',operand:{op:'-'}}]});});
 it.each(['let x: int;','let if: int = 0;','if (true) print(1);','while (true) {} else {}','print();;','print(input());','let x: int = print(1);','print(foo());','input("x");','{','print(1)','if (true) {} else if (false) {}'])('stops on invalid grammar: %s',source=>{expect(()=>program(source)).toThrow(SourceFailure);});
 it('empty/comment-only source yields Program; EOF error has exact zero-width span',()=>{expect(program('/* empty */').statements).toEqual([]);try{program('print(1');expect.fail();}catch(error){expect((error as SourceFailure).diagnostic.span).toMatchObject({start:7,end:7});}});
 it('enforces parentheses, block, and unary nesting at 128/129',()=>{for(const pair of [['(',')'],['{','}'],['-','']] as const){const [open,close]=pair;const text=(n:number)=>open==='{'?open.repeat(n)+close.repeat(n):'print('+open.repeat(n)+'1'+close.repeat(n)+');';expect(()=>program(text(128))).not.toThrow();expect(()=>program(text(129))).toThrow(LimitFailure);}});
 it('validates deep flat expressions and invalid-arity ASTs without a hidden schema-depth cap',()=>{const ast=program('print('+Array(1200).fill('1').join('+')+');');expect(boundary(ProgramSchema).safeParse(ast).success).toBe(true);expect(ProgramSchema.safeParse(program('sql_bind(1,2,3);')).success).toBe(true);});
 it('enforces AST counts without allocating a partial public tree',()=>{expect(()=>program('print(0);'.repeat(9999))).not.toThrow();expect(()=>program('print(0);'.repeat(10000))).toThrow(LimitFailure);});
});
