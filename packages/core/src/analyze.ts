import { ANALYZER_VERSION, SourceSnapshotSchema, validateAnalysisRequest } from './contracts.js';
import { BudgetGuard, DEFAULT_LIMITS, type BudgetHooks } from './limits.js';
import { DiagnosticFailure, SourceFailure, LimitFailure, CancelledFailure, makeDiagnostic } from './diagnostics.js';
import { utf8ByteLength } from './source.js';
import { lex } from './lexer.js';
import { parse } from './parser.js';
import { checkSemantics } from './semantic.js';
import { lowerProgram } from './lower.js';
import { preorder } from './ast.js';
import { solveTaint } from './taint.js';
import { collectFindings } from './findings.js';
import { buildProvenance } from './provenance.js';
import { ReplayRecorder } from './replay.js';
import { generateBytecode, disassembleBytecode } from './codegen.js';
import { verifyBytecode } from './verify.js';
import type { AnalysisProgress, AnalysisResult, DiagnosticStage } from './model.js';

export interface AnalysisHooks extends BudgetHooks {onProgress?:(progress:AnalysisProgress)=>void}
export function analyzeSource(raw:unknown,hooks:AnalysisHooks):AnalysisResult {
 const start=hooks.nowMs(),guard=new BudgetGuard(hooks);
 const requestId=typeof raw==='object'&&raw!==null&&'requestId' in raw&&typeof raw.requestId==='string'&&raw.requestId.length>0&&raw.requestId.length<=128?raw.requestId:'invalid-request';
 const result:AnalysisResult={type:'analysis-result',schemaVersion:1,requestId,analyzerVersion:ANALYZER_VERSION,languageVersion:1,status:'internal-error',completedStages:[],diagnostics:[],artifacts:{},limits:DEFAULT_LIMITS,
  statistics:{sourceUtf8Bytes:0,tokenCount:0,astCount:0,slotCount:0,cfgNodeCount:0,inputSourceCount:0,processedNodeCount:0,updateCount:0,bytecodeCount:0,stageDurationsMs:{validate:0,lex:0,parse:0,semantic:0,lower:0,taint:0,findings:0,codegen:0,verify:0},totalDurationMs:0},
  limitations:['Structural paths are overapproximated; a finding does not prove a feasible attack.','Explicit data flow only; implicit control flow is not tracked.','SQL and shell sinks are educational models.']};
 const valid=validateAnalysisRequest(raw);
 if(!valid.ok){result.status='invalid-request';result.diagnostics=valid.diagnostics;const candidate=typeof raw==='object'&&raw!==null&&'snapshot' in raw?SourceSnapshotSchema.safeParse(raw.snapshot):null;if(candidate?.success)result.snapshot=candidate.data;result.statistics.totalDurationMs=Math.max(0,hooks.nowMs()-start);return result;}
 const request=valid.request;result.snapshot=request.snapshot;
 let active:DiagnosticStage='validate',stageStart=hooks.nowMs();
 const stage=(name:AnalysisProgress['stage'],work:()=>void)=>{active=name;stageStart=hooks.nowMs();hooks.onProgress?.({type:'progress',protocolVersion:1,requestId,revision:request.snapshot.revision,stage:name});guard.checkpoint(name,true);work();guard.checkpoint(name,true);result.completedStages.push(name);result.statistics.stageDurationsMs[name]=Math.max(0,hooks.nowMs()-stageStart);};
 try {
  stage('validate',()=>{const bytes=utf8ByteLength(request.snapshot.source);result.statistics.sourceUtf8Bytes=bytes;guard.checkCount('maxSourceBytes',bytes,'LIMIT_SOURCE','validate');});
  stage('lex',()=>{result.artifacts.tokens=lex(request.snapshot,guard);result.statistics.tokenCount=result.artifacts.tokens.length;});
  stage('parse',()=>{result.artifacts.ast=parse(result.artifacts.tokens!,request.snapshot,guard);result.statistics.astCount=preorder(result.artifacts.ast).length;});
  stage('semantic',()=>{result.artifacts.semantic=checkSemantics(result.artifacts.ast!,request.snapshot,guard);result.diagnostics.push(...result.artifacts.semantic.diagnostics);result.statistics.inputSourceCount=result.artifacts.semantic.inputSources.length;});
  const error=result.diagnostics.find(d=>d.blocking);if(error)throw new SourceFailure(error);
  stage('lower',()=>{result.artifacts.lowered=lowerProgram(result.artifacts.ast!,result.artifacts.semantic!,guard);result.statistics.slotCount=result.artifacts.lowered.slots.length;result.statistics.cfgNodeCount=result.artifacts.lowered.instructions.length;});
  stage('taint',()=>{const recorder=request.options.recordReplay?new ReplayRecorder(result.artifacts.lowered!):undefined;result.artifacts.taint=solveTaint(result.artifacts.lowered!,guard,recorder,count=>hooks.onProgress?.({type:'progress',protocolVersion:1,requestId,revision:request.snapshot.revision,stage:'taint',completedWork:count}));if(recorder)result.artifacts.replay=recorder.trace;result.statistics.processedNodeCount=result.artifacts.taint.processedNodeCount;result.statistics.updateCount=result.artifacts.taint.updateCount;});
  let findings:ReturnType<typeof collectFindings>=[];
  stage('findings',()=>{findings=collectFindings(result.artifacts.lowered!,result.artifacts.taint!,result.artifacts.semantic!);result.artifacts.explanations=buildProvenance(result.artifacts.lowered!,result.artifacts.taint!,findings,guard);if(findings.some(f=>!f.explanationComplete))result.limitations.push('Possible-flow explanations were truncated; source sets remain complete.');});
  if(result.diagnostics.some(d=>d.code==='TEMPLATE_UNVERIFIED'))result.limitations.push('Nonliteral binding-template format remains unverified.');
  if(result.artifacts.replay?.truncated)result.limitations.push('Replay was truncated; its last recorded update is not necessarily the fixed point.');
  let bytecode:ReturnType<typeof generateBytecode>;
  let disassembly:string[]=[];
  stage('codegen',()=>{bytecode=generateBytecode(result.artifacts.lowered!,request.snapshot,guard);result.statistics.bytecodeCount=bytecode.instructions.length;disassembly=disassembleBytecode(bytecode);});
  stage('verify',()=>{bytecode.maxVerifiedStack=verifyBytecode(bytecode,guard);});
  result.artifacts.findings=findings;result.artifacts.bytecode=bytecode!;result.artifacts.disassembly=disassembly;result.status='completed';
 } catch(error){
  result.status=error instanceof CancelledFailure?'cancelled':error instanceof LimitFailure?'incomplete-limit':error instanceof SourceFailure?'invalid-source':'internal-error';
  const diagnostic=error instanceof DiagnosticFailure?error.diagnostic:makeDiagnostic('ENGINE_INTERNAL',active,'Analysis failed internally. Please retry.');
  if(!result.diagnostics.includes(diagnostic))result.diagnostics.push(diagnostic);
 }
 result.statistics.totalDurationMs=Math.max(0,hooks.nowMs()-start);return result;
}
