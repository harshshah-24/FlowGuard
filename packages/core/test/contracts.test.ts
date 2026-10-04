import {describe,it,expect} from 'vitest';
import {boundary,AnalyzeRequestSchema,AnalysisResultSchema,ReportSchema,ExecutionRequestSchema,ExecutionResultSchema,BytecodeInstructionSchema,ScalarSchema,DiagnosticSchema,ExecutionEventSchema,ExampleProgramSchema,validateAnalysisRequest,DEFAULT_LIMITS} from '../src/index.js';
import {emptyAnalysis,snapshot} from './fixtures.js';
import {readFileSync} from 'node:fs';
const request=()=>({type:'analyze',protocolVersion:1,requestId:'r1',snapshot:snapshot(),options:{recordReplay:true}});
describe('versioned strict contracts',()=>{
 it('rejects unknown keys and unsupported versions',()=>{
  expect(validateAnalysisRequest({...request(),run:true}).ok).toBe(false);
  const invalid=validateAnalysisRequest({...request(),protocolVersion:2});
  expect(invalid.ok).toBe(false);if(!invalid.ok)expect(invalid.diagnostics[0]?.code).toBe('SCHEMA_UNSUPPORTED');
  expect(AnalyzeRequestSchema.safeParse(request()).success).toBe(true);
  expect(AnalyzeRequestSchema.safeParse({...request(),snapshot:{...snapshot(),revision:1}}).success).toBe(false);
 });
 it('rejects explicit undefined and cycles at boundaries',()=>{
  expect(boundary(AnalyzeRequestSchema).safeParse({...request(),snapshot:{...snapshot(),filename:undefined}}).success).toBe(false);
  const cyclic:{child?:unknown}={};cyclic.child=cyclic;
  expect(boundary(AnalysisResultSchema).safeParse(cyclic).success).toBe(false);
 });
 it('rejects explicit undefined even in standalone object schemas',()=>{
  expect(DiagnosticSchema.safeParse({code:'SEM_TYPE',stage:'semantic',severity:'error',message:'Type mismatch.',blocking:true,span:undefined}).success).toBe(false);
 });
 it('validates an independently written empty-program schema fixture',()=>{expect(boundary(AnalysisResultSchema).safeParse(emptyAnalysis()).success).toBe(true);});
 it('never accepts a completed result missing required artifacts/stages',()=>{
  const result=emptyAnalysis();
  expect(AnalysisResultSchema.safeParse({...result,artifacts:{}}).success).toBe(false);
  expect(AnalysisResultSchema.safeParse({...result,completedStages:['validate']}).success).toBe(false);
 });
 it('distinguishes invalid/incomplete results from security findings',()=>{
  const result=emptyAnalysis();
  for(const status of ['invalid-source','cancelled','incomplete-limit','internal-error']) {
   expect(AnalysisResultSchema.safeParse({...result,status}).success).toBe(false);
   expect(AnalysisResultSchema.safeParse({...result,status,artifacts:{},completedStages:[]}).success).toBe(true);
  }
 });
 it('keeps execution versions, snapshots and simulated events separate',()=>{
  const analysis=emptyAnalysis(),snap=analysis.snapshot!;
  const execution={schemaVersion:1,requestId:'run-1',snapshotId:snap.snapshotId,revision:0,status:'completed',diagnostics:[],events:[],consumedInputCount:0,instructionCount:1,elapsedMs:0,finalTopLevelValues:[],limits:DEFAULT_LIMITS};
  expect(ExecutionResultSchema.safeParse(execution).success).toBe(true);
  expect(ReportSchema.safeParse({schemaVersion:1,analysis,execution:{...execution,snapshotId:'different'}}).success).toBe(false);
  const run={type:'execute',protocolVersion:1,requestId:'run-1',snapshotId:snap.snapshotId,revision:0,bytecode:analysis.artifacts.bytecode,inputs:['hello']};
  expect(ExecutionRequestSchema.safeParse(run).success).toBe(true);
  expect(ExecutionRequestSchema.safeParse({...run,inputs:[123]}).success).toBe(false);
  expect(ExecutionRequestSchema.safeParse({...run,inputs:['a'.repeat(DEFAULT_LIMITS.maxStringBytes+1)]}).success).toBe(false);
  expect(ExecutionResultSchema.safeParse({...execution,status:'runtime-error'}).success).toBe(true);
 });
 it('checks bytecode arity and scalar ranges without implementing a VM',()=>{
  expect(BytecodeInstructionSchema.safeParse({opcode:'LOAD',operands:[]}).success).toBe(false);
  expect(BytecodeInstructionSchema.safeParse({opcode:'HALT',operands:[0]}).success).toBe(false);
  expect(ScalarSchema.safeParse({type:'int',value:2147483648}).success).toBe(false);
 });
 it('rejects raising limits in serialized results',()=>{
  const result=emptyAnalysis();expect(AnalysisResultSchema.safeParse({...result,limits:{...DEFAULT_LIMITS,maxSolverVisits:999999}}).success).toBe(false);
 });
 it('rejects contradictory diagnostics and real-looking modeled events',()=>{
  expect(DiagnosticSchema.safeParse({code:'SEM_TYPE',stage:'semantic',severity:'notice',message:'wrong type',blocking:false}).success).toBe(false);
  const span={start:0,end:0,startLine:1,startColumn:1,endLine:1,endColumn:1};
  expect(ExecutionEventSchema.safeParse({index:0,pc:0,span,kind:'shell',command:'echo hello',simulated:false}).success).toBe(false);
 });
 it('rejects artifacts that have not completed their producing stage',()=>{
  const result=emptyAnalysis();expect(AnalysisResultSchema.safeParse({...result,status:'invalid-source',completedStages:['validate'],artifacts:{tokens:result.artifacts.tokens}}).success).toBe(false);
 });
 it('validates the synthetic catalog as expectations, not engine output',()=>{
  const catalog=JSON.parse(readFileSync(new URL('../../../examples/catalog.json',import.meta.url),'utf8')) as unknown[];
  expect(catalog).toHaveLength(9);for(const example of catalog)expect(ExampleProgramSchema.safeParse(example).success).toBe(true);
 });
});
