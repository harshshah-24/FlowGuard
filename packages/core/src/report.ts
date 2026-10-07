import { ReportSchema, boundary } from './contracts.js';
import { CappedWriter, writeJson } from './json.js';
import type { AnalysisResult, ExecutionResult, Report } from './model.js';
export function buildReport(analysis:AnalysisResult,execution?:ExecutionResult):Report {
 return boundary(ReportSchema).parse({schemaVersion:1,analysis,...(execution?{execution}:{})});
}
export function serializeReport(report:Report,format:'json'|'markdown'):string {
 const accepted=boundary(ReportSchema).parse(report),writer=new CappedWriter();
 if(format==='json'){writeJson(accepted,chunk=>writer.append(chunk),true);writer.append('\n');return writer.finish();}
 if(format!=='markdown')throw new Error('Unsupported report format.');
 const r=accepted.analysis;
 const line=(s='')=>writer.append(s+'\n');
 const fence=(text:string,language='')=>{let longest=0,current=0;for(const char of text){if(char==='`'){current++;longest=Math.max(longest,current);}else current=0;}const marker='`'.repeat(Math.max(3,longest+1));line(marker+language);line(text);line(marker);};
 line('# FlowGuard report');line();line(`Outcome: ${r.status}. ${r.status!=='completed'?'INCOMPLETE — no final security verdict or runnable bytecode.':''}`);
 line(`Analyzer ${r.analyzerVersion}; language ${r.languageVersion}; schema ${accepted.schemaVersion}.`);
 if(r.snapshot){line(`Snapshot: ${r.snapshot.snapshotId}; revision ${r.snapshot.revision}.`);line(`SHA-256: ${r.snapshot.sha256}`);line();line('## Source');fence(r.snapshot.source,'fg');}
 line('## Diagnostics');fence(r.diagnostics.map(d=>`${d.code} (${d.stage}): ${d.message}`).join('\n')||'None.');
 line('## Possible-flow findings');fence(r.artifacts.findings? r.artifacts.findings.map(f=>`${f.rule} at ${f.span.startLine}:${f.span.startColumn}; sources: ${f.sourceIds.join(', ')}; explanation complete: ${f.explanationComplete}`).join('\n')||'No modeled explicit flow findings.':'Unavailable until complete analysis.');
 line('## Limitations');for(const limitation of r.limitations)line('- '+limitation);
 line('## Compiler summary');line(`Completed stages: ${r.completedStages.join(', ')||'none'}.`);
 line(`Tokens: ${r.statistics.tokenCount}; AST nodes: ${r.statistics.astCount}; slots: ${r.statistics.slotCount}; CFG nodes: ${r.statistics.cfgNodeCount}; source identities: ${r.artifacts.semantic?.inputSources.map(s=>s.id).join(', ')||'none'}.`);
 line('## Bytecode');fence(r.artifacts.disassembly?.join('\n')??'Unavailable.');
 const jsonFence=(value:unknown)=>{let longest=0;const stack:unknown[]=[value];while(stack.length){const item=stack.pop();if(typeof item==='string'){let current=0;for(const ch of item){if(ch==='`'){current++;longest=Math.max(longest,current);}else current=0;}}else if(item&&typeof item==='object')stack.push(...Object.values(item));}const marker='`'.repeat(Math.max(3,longest+1));line(marker+'json');writeJson(value,chunk=>writer.append(chunk),true);line();line(marker);};
 if(accepted.execution){line('## Simulated execution');jsonFence(accepted.execution);}
 line('## Limits and statistics');jsonFence({limits:r.limits,statistics:r.statistics});
 return writer.finish();
}
