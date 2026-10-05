import { createHash } from 'node:crypto';
import { BudgetGuard } from '../src/limits.js';
import { lex } from '../src/lexer.js';
import { parse } from '../src/parser.js';
import { checkSemantics } from '../src/semantic.js';
import { lowerProgram } from '../src/lower.js';
export function guard(){return new BudgetGuard({nowMs:()=>0});}
export function snapshot(source:string){const sha256=createHash('sha256').update(source).digest('hex');return {source,filename:'test.fg',revision:0,sha256,snapshotId:`snapshot-0-${sha256}`};}
export function front(source:string){const snap=snapshot(source),g=guard(),tokens=lex(snap,g),ast=parse(tokens,snap,g),semantic=checkSemantics(ast,snap,g);return {tokens,ast,semantic};}
export function lowered(source:string){const result=front(source);return {...result,lowered:lowerProgram(result.ast,result.semantic,guard())};}
