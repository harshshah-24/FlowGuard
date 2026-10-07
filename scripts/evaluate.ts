import { readFile } from 'node:fs/promises';
import { evidence,analyze,hash,machine,sampleReports } from './evidence.js';
interface Unit {line:number;rule:'SQL_QUERY_TEXT'|'SHELL_COMMAND_TEXT';positive:boolean;sourceIds:string[]}
interface Fixture {id:string;filename:string;expectedStatus:string;diagnostics:string[];units:Unit[];structurallyInfeasible?:boolean}
const manifest=JSON.parse(await readFile('fixtures/evaluation.json','utf8')) as {schemaVersion:1;countingUnit:string;fixtures:Fixture[]};
let tp=0,fp=0,fn=0,tn=0,invalid=0,incomplete=0,mismatches=0;const results=[];
for(const f of manifest.fixtures){const source=await readFile(f.filename,'utf8'),result=analyze(source,f.id),actual=result.artifacts.findings??[];let matched=result.status===f.expectedStatus&&JSON.stringify(result.diagnostics.map(d=>d.code))===JSON.stringify(f.diagnostics);
 if(result.status==='invalid-source'||result.status==='invalid-request')invalid++;else if(result.status!=='completed')incomplete++;
 const units=(result.status==='completed'?f.units:[]).map(unit=>{const finding=actual.find(x=>x.span.startLine===unit.line&&x.rule===unit.rule),predicted=!!finding;const outcome=unit.positive?(predicted?'TP':'FN'):(predicted?'FP':'TN');if(outcome==='TP')tp++;if(outcome==='FP')fp++;if(outcome==='FN')fn++;if(outcome==='TN')tn++;
  // Infeasible positives are intentionally labeled negative for feasibility accuracy.
  const sourcesMatch=!predicted||JSON.stringify(finding!.sourceIds)===JSON.stringify(unit.sourceIds);matched&&=sourcesMatch;return {...unit,predicted,outcome,actualSourceIds:finding?.sourceIds??[],sourcesMatch};});
 const unexpected=actual.filter(x=>!f.units.some(u=>u.line===x.span.startLine&&u.rule===x.rule));matched&&=unexpected.length===0;if(!matched)mismatches++;
 results.push({id:f.id,filename:f.filename,sha256:hash(source),expectedStatus:f.expectedStatus,status:result.status,diagnostics:result.diagnostics,structurallyInfeasible:f.structurallyInfeasible??false,units,unexpectedFindings:unexpected,matched});
}
const infeasible=results.filter(r=>r.structurallyInfeasible).flatMap(r=>r.units),feasible=results.filter(r=>!r.structurallyInfeasible).flatMap(r=>r.units);const subset=(units:typeof feasible)=>{const counts={tp:0,fp:0,fn:0,tn:0};for(const u of units)counts[u.outcome.toLowerCase() as keyof typeof counts]++;return {...counts,precision:counts.tp+counts.fp?counts.tp/(counts.tp+counts.fp):null,recall:counts.tp+counts.fn?counts.tp/(counts.tp+counts.fn):null};};
const summary={subsets:{structurallyInfeasible:subset(infeasible),otherCases:subset(feasible)},tp,fp,fn,tn,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,invalid,incomplete,mismatches};await evidence('evaluation',{schemaVersion:1,manifestSha256:hash(JSON.stringify(manifest)),machine:machine(),countingUnit:manifest.countingUnit,summary,results});await sampleReports();console.log(JSON.stringify(summary));if(mismatches||fn||incomplete)process.exitCode=1;
