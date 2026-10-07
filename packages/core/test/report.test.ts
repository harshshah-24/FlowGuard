import { describe,it,expect } from 'vitest';
import { analyzeSource } from '../src/analyze.js';
import { buildReport,serializeReport } from '../src/report.js';
import { snapshot } from './frontend-helper.js';
import { emptyAnalysis } from './fixtures.js';
describe('bounded versioned reports',()=>{
 const report=(source='print("x");')=>buildReport(analyzeSource({type:'analyze',protocolVersion:1,requestId:'test',snapshot:snapshot(source),options:{recordReplay:true}},{nowMs:()=>0}));
 it('roundtrips exact text, versions, fixed limits and incomplete identity',()=>{const r=report('\uFEFFprint("😀");\r\n');const text=serializeReport(r,'json');expect(JSON.parse(text)).toEqual(r);expect(text.endsWith('\n')).toBe(true);expect(text).toContain('\n  "schemaVersion": 1,');});
 it('chooses fences longer than embedded runs and labels incomplete results',()=>{const text=serializeReport(report('print("````\\n# forged"); print(unknown);'),'markdown');expect(text).toContain('`````fg');expect(text).toContain('INCOMPLETE');expect(text).toContain('Unavailable until complete analysis.');});
 it('rejects forged completion, unsupported versions and mismatched runtime',()=>{const r=report('print(unknown);');expect(()=>serializeReport({...r,schemaVersion:2} as never,'json')).toThrow();expect(()=>buildReport({...r.analysis,status:'completed'})).toThrow();const a=emptyAnalysis();expect(()=>buildReport(a,{schemaVersion:1,requestId:'x',snapshotId:'other',revision:0,status:'completed',diagnostics:[],events:[],consumedInputCount:0,instructionCount:0,elapsedMs:0,finalTopLevelValues:[],limits:a.limits})).toThrow();});
 it('rejects oversized output before joining and supports escaped lone surrogates',()=>{const r=report();r.analysis.limitations=['x'.repeat(16777217)];expect(()=>serializeReport(r,'json')).toThrow('16 MiB');const s=report('print("\ud800");');expect(JSON.parse(serializeReport(s,'json'))).toEqual(s);});
 it('protects runtime event text with dynamically sized JSON fences',()=>{const a=emptyAnalysis(),span=a.artifacts.lowered!.instructions[0]!.span;const r=buildReport(a,{schemaVersion:1,requestId:'runtime',snapshotId:a.snapshot!.snapshotId,revision:0,status:'completed',diagnostics:[],events:[{index:0,pc:0,span,kind:'shell',simulated:true,command:'````\n# payload'}],consumedInputCount:0,instructionCount:1,elapsedMs:0,finalTopLevelValues:[],limits:a.limits});expect(serializeReport(r,'markdown')).toContain('`````json');});
});
