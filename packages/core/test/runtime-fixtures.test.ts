import { readFileSync } from 'node:fs';
import { describe,it,expect } from 'vitest';
import { analyzeSource } from '../src/analyze.js';
import { runBytecode } from '../src/vm.js';
import { snapshot } from './frontend-helper.js';
const manifest=JSON.parse(readFileSync('fixtures/runtime/manifest.json','utf8')) as {fixtures:{id:string;filename:string;inputs:string[];status:string;diagnosticCodes:string[];events:unknown[]}[]};
describe('independently specified runtime fixture outcomes',()=>{
 it.each(manifest.fixtures)('$id',f=>{const snap=snapshot(readFileSync(`examples/${f.filename}`,'utf8')),a=analyzeSource({type:'analyze',protocolVersion:1,requestId:f.id,snapshot:snap,options:{recordReplay:false}},{nowMs:()=>0});expect(a.status).toBe('completed');const b=a.artifacts.bytecode!,r=runBytecode({type:'execute',protocolVersion:1,requestId:f.id,revision:0,snapshotId:snap.snapshotId,bytecode:b,inputs:f.inputs},{nowMs:()=>0});expect(r.status).toBe(f.status);expect(r.diagnostics.map(d=>d.code)).toEqual(f.diagnosticCodes);expect(r.events.map(({index,pc,span,...payload})=>{expect(index).toBeGreaterThanOrEqual(0);expect(span).toEqual(b.sourceMap[pc]!.span);return payload;})).toEqual(f.events);});
});
