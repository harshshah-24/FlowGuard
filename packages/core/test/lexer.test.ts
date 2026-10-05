import { describe,it,expect } from 'vitest';
import { lex } from '../src/lexer.js';
import { SourceFailure,LimitFailure,CancelledFailure } from '../src/diagnostics.js';
import { BudgetGuard } from '../src/limits.js';
import { snapshot,guard } from './frontend-helper.js';
describe('lexer',()=>{
 it('matches reserved words, longest operators, comments, and EOF',()=>{const tokens=lex(snapshot('let a: bool = true && false || (1 <= 2) != false; // end\r\n/* x */'),guard());expect(tokens.map(t=>t.kind)).toEqual(['LET','IDENTIFIER','COLON','TYPE_BOOL','ASSIGN','TRUE','AND','FALSE','OR','LPAREN','INTEGER','LE','INTEGER','RPAREN','NE','FALSE','SEMICOLON','EOF']);expect(tokens.at(-1)!.span.start).toBe(tokens.at(-1)!.span.end);});
 it('decodes supported escapes and preserves BOM, CRLF, and UTF-16 positions',()=>{const source='\uFEFFprint("😀\\n\\r\\t\\\\\\\"");\r\nlet x: int = 2147483647;';const t=lex(snapshot(source),guard());expect(t[0]!.span.startColumn).toBe(2);expect(t[2]!.literal).toEqual({type:'string',value:'😀\n\r\t\\"'});expect(t.find(t=>t.kind==='LET')!.span).toMatchObject({startLine:2,startColumn:1});expect(t.at(-1)!.span.end).toBe(source.length);});
 it.each([['@','LEX_INVALID_CHAR'],['\uFEFF \uFEFF','LEX_INVALID_CHAR'],['"a\n"','LEX_UNTERMINATED_STRING'],['"a','LEX_UNTERMINATED_STRING'],['"\\q"','LEX_INVALID_ESCAPE'],['/* x','LEX_UNTERMINATED_COMMENT'],['2147483648','LEX_INTEGER_RANGE']])('rejects %s with %s',(source,code)=>{try{lex(snapshot(source),guard());expect.fail();}catch(error){expect(error).toBeInstanceOf(SourceFailure);expect((error as SourceFailure).diagnostic.code).toBe(code);}});
 it('handles nonnested comments and prototype-looking identifiers',()=>{expect(lex(snapshot('/* /* */ constructor __proto__'),guard()).map(t=>t.kind)).toEqual(['IDENTIFIER','IDENTIFIER','EOF']);});
 it('enforces exact source/token budgets and cancellation while scanning',()=>{expect(()=>lex(snapshot(' '.repeat(262144)),guard())).not.toThrow();expect(()=>lex(snapshot(' '.repeat(262145)),guard())).toThrow(LimitFailure);expect(lex(snapshot('x '.repeat(65535)),guard())).toHaveLength(65536);expect(()=>lex(snapshot('x '.repeat(65536)),guard())).toThrow(LimitFailure);expect(()=>lex(snapshot('/*'+'x'.repeat(2000)+'*/'),new BudgetGuard({nowMs:()=>0,checkpointAbort:()=>true}))).toThrow(CancelledFailure);});
});
