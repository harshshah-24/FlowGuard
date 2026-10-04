import {createHash} from 'node:crypto';
import type {AnalysisResult,SourceSnapshot} from '../src/model.js';
import {DEFAULT_LIMITS} from '../src/limits.js';
// Manually defined schema fixture, NOT output from an implemented compiler.
export function snapshot(source='',revision=0):SourceSnapshot {
 const sha256=createHash('sha256').update(source).digest('hex');
 return {snapshotId:`snapshot-${revision}-${sha256}`,revision,filename:'program.fg',source,sha256};
}
export function emptyAnalysis(source='',revision=0):AnalysisResult {
 const snap=snapshot(source,revision),span={start:0,end:0,startLine:1,startColumn:1,endLine:1,endColumn:1};
 return {type:'analysis-result',schemaVersion:1,requestId:'test-1',snapshot:snap,analyzerVersion:'0.1.0',languageVersion:1,status:'completed',
 completedStages:['validate','lex','parse','semantic','lower','taint','findings','codegen','verify'],diagnostics:[],limits:DEFAULT_LIMITS,
 statistics:{sourceUtf8Bytes:0,tokenCount:1,astCount:1,slotCount:0,cfgNodeCount:1,inputSourceCount:0,processedNodeCount:1,updateCount:1,bytecodeCount:1,stageDurationsMs:{validate:0,lex:0,parse:0,semantic:0,lower:0,taint:0,findings:0,codegen:0,verify:0},totalDurationMs:0},limitations:['Hand-authored contract fixture only.'],
 artifacts:{tokens:[{id:'tok-0',kind:'EOF',span,lexeme:''}],ast:{id:'ast-0',kind:'Program',span,statements:[]},semantic:{symbols:[],scopes:[],expressionTypes:{},resolvedUses:{},inputSources:[],diagnostics:[]},lowered:{slots:[],instructions:[{id:'ir-0',op:'halt',astId:'ast-0',span,visibleSymbolIds:[]}],edges:[],entryNodeId:'ir-0',exitNodeId:'ir-0',sourceMap:{'ir-0':span}},taint:{states:{'ir-0':{in:{reachable:true,entries:[]},out:{reachable:true,entries:[]}}},processedNodeCount:1,updateCount:1,reachedNodeIds:['ir-0']},findings:[],bytecode:{version:1,snapshotId:snap.snapshotId,sourceSha256:snap.sha256,slots:[],sourceIds:[],constants:[],instructions:[{opcode:'HALT',operands:[]}],sourceMap:[{pc:0,irNodeId:'ir-0',astId:'ast-0',span}],maxVerifiedStack:0},disassembly:['0 HALT']}};
}
