import { describe,it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { lowered,guard } from './frontend-helper.js';
import { solveTaint } from '../src/taint.js';
import { TaintResultSchema,FindingSchema } from '../src/contracts.js';
import { BudgetGuard, DEFAULT_LIMITS } from '../src/limits.js';
const direct='let a: string = input("a");';
import { staticAnalysis } from './static-helper.js';
describe('converged explicit may-taint',()=>{
 it.each([
  ['direct SQL',direct+'sql_query(a);',['SQL_QUERY_TEXT'],[['src-0']]],
  ['direct shell',direct+'shell(a);',['SHELL_COMMAND_TEXT'],[['src-0']]],
  ['three hops',direct+'let b:string=a; let c:string=b; let d:string=c; sql_query(d);',['SQL_QUERY_TEXT'],[['src-0']]],
  ['two sources',direct+'let b:string=input("b"); shell(a+b);',['SHELL_COMMAND_TEXT'],[['src-0','src-1']]],
  ['overwrite',direct+'a="trusted"; shell(a);',[],[]],
  ['branch union','let a:string=""; if(true){a=input("a");}else{a=input("b");} sql_query(a);',['SQL_QUERY_TEXT'],[['src-0','src-1']]],
  ['zero-iteration path',direct+'while(false){a="trusted";} sql_query(a);',['SQL_QUERY_TEXT'],[['src-0']]],
  ['repeated source','let a:string=""; while(true){a=input("a");}sql_query(a);',['SQL_QUERY_TEXT'],[['src-0']]],
  ['bound value',direct+'sql_bind("SELECT ?",a);',[],[]],
  ['binding template',direct+'sql_bind(a,1);',['SQL_QUERY_TEXT'],[['src-0']]],
  ['print excluded',direct+'print(a);',[],[]],
  ['no implicit flow',direct+'let b:string=""; if(a=="x"){b="a";}else{b="b";} shell(b);',[],[]],
  ['input ignores prompt taint',direct+'let b:string=input(a);shell(b);',['SHELL_COMMAND_TEXT'],[['src-1']]],
 ] as const)('%s',(_,source,rules,sources)=>{const r=staticAnalysis(source);expect(r.findings.map(f=>f.rule)).toEqual(rules);expect(r.findings.map(f=>f.sourceIds)).toEqual(sources);expect(TaintResultSchema.safeParse(r.taint).success).toBe(true);r.findings.forEach(f=>expect(FindingSchema.safeParse(f).success).toBe(true));});
 it('conservatively keeps constant short-circuit structural alternatives',()=>{const r=staticAnalysis('let b:bool=false && input("x")=="a";');const symbol=r.semantic.symbols[0]!;expect(r.taint.states[r.lowered.exitNodeId]!.in.entries.find(e=>e.slotId===symbol.slotId)?.sourceIds).toEqual(['src-0']);});
 it('matches all nine independent teaching-example labels',()=>{const catalog=JSON.parse(readFileSync('examples/catalog.json','utf8')) as {filename:string;expectedFindingRules:string[]}[];for(const item of catalog){const r=staticAnalysis(readFileSync(`examples/${item.filename}`,'utf8'));expect(r.findings.map(f=>f.rule),item.filename).toEqual(item.expectedFindingRules);}});
 it('does not mutate or alias source sets across overwrite nodes',()=>{const r=staticAnalysis(direct+'a="trusted";sql_query(a);');const input=r.lowered.instructions.find(n=>n.op==='input')!;expect(r.taint.states[input.id]!.out.entries.some(e=>e.sourceIds.length)).toBe(true);expect(r.findings).toEqual([]);});
 it('produces deterministic states and finite source identities through loops',()=>{const source='let x:string="";let i:int=0;while(i<3){x=x+input("x");i=i+1;}shell(x);';const a=staticAnalysis(source),b=staticAnalysis(source);expect(a.taint).toEqual(b.taint);expect(a.findings[0]!.sourceIds).toEqual(['src-0']);expect(a.taint.processedNodeCount).toBeLessThan(1000);});
 it.each([['maxStateCells',0,'LIMIT_ANALYSIS_STORAGE'],['maxSourceMemberships',0,'LIMIT_ANALYSIS_STORAGE'],['maxSolverVisits',0,'LIMIT_SOLVER']] as const)('enforces %s', (key,value,code)=>{const g=new BudgetGuard({nowMs:()=>0});Object.defineProperty(g,'limits',{value:{...DEFAULT_LIMITS,[key]:value}});const p=lowered(direct+'shell(a);').lowered;try{solveTaint(p,g);throw new Error('Expected limit');}catch(e){expect(e).toMatchObject({diagnostic:{code}});}});
 it('checks cancellation and deadline',()=>{const p=lowered('print(1);').lowered;expect(()=>solveTaint(p,new BudgetGuard({nowMs:()=>0,checkpointAbort:()=>true}))).toThrow('cancelled');let time=0;const g=new BudgetGuard({nowMs:()=>time});time=10000;expect(()=>solveTaint(p,g)).toThrow('deadline');});
 it('validates independent manifest sink units and source contributions',()=>{const manifest=JSON.parse(readFileSync('fixtures/taint/manifest.json','utf8')) as {fixtures:{filename:string;diagnostics:string[];findings:{rule:string;sinkLine:number;sourceIds:string[]}[]}[]};for(const fixture of manifest.fixtures){const source=readFileSync(`fixtures/taint/${fixture.filename}`,'utf8'),r=staticAnalysis(source);expect(r.semantic.diagnostics.map(d=>d.code),fixture.filename).toEqual(fixture.diagnostics);expect(r.findings.map(f=>({rule:f.rule,sinkLine:f.span.startLine,sourceIds:f.sourceIds})),fixture.filename).toEqual(fixture.findings);for(const f of r.findings)expect(source.slice(f.span.start,f.span.end)).toMatch(/^(sql_query|sql_bind|shell)\(/);}});
 it('allows exact solver/state/membership budgets and rejects one less',()=>{const p=lowered(direct+'shell(a);').lowered,r=solveTaint(p,guard()),members=Object.values(r.states).reduce((total,states)=>total+[states.in,states.out].reduce((n,s)=>n+s.entries.reduce((a,e)=>a+e.sourceIds.length,0),0),0);for(const [key,cap] of [['maxSolverVisits',r.processedNodeCount],['maxStateCells',2*p.instructions.length*p.slots.length],['maxSourceMemberships',members]] as const){const g=new BudgetGuard({nowMs:()=>0});Object.defineProperty(g,'limits',{value:{...DEFAULT_LIMITS,[key]:cap}});expect(()=>solveTaint(p,g)).not.toThrow();const low=new BudgetGuard({nowMs:()=>0});Object.defineProperty(low,'limits',{value:{...DEFAULT_LIMITS,[key]:cap-1}});expect(()=>solveTaint(p,low)).toThrow('limit exceeded');}});
});
