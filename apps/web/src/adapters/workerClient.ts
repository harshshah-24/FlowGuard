import { AnalysisMessageSchema, DEFAULT_LIMITS, makeDiagnostic, type AnalysisProgress, type AnalysisResult, type AnalyzeRequest } from '@flowguard/core';
export function failedAnalysis(request:AnalyzeRequest,code:'WORKER_FAILED'|'LIMIT_COMPILE_TIME'|'CANCELLED'):AnalysisResult {
 return {type:'analysis-result',schemaVersion:1,requestId:request.requestId,snapshot:request.snapshot,analyzerVersion:'0.1.0',languageVersion:1,status:code==='CANCELLED'?'cancelled':code==='LIMIT_COMPILE_TIME'?'incomplete-limit':'internal-error',completedStages:[],diagnostics:[makeDiagnostic(code,'validate',code==='CANCELLED'?'Analysis cancelled.':code==='LIMIT_COMPILE_TIME'?'Analysis worker exceeded its deadline.':'Analysis worker failed. Please retry.')],artifacts:{},limits:DEFAULT_LIMITS,statistics:{sourceUtf8Bytes:0,tokenCount:0,astCount:0,slotCount:0,cfgNodeCount:0,inputSourceCount:0,processedNodeCount:0,updateCount:0,bytecodeCount:0,stageDurationsMs:{validate:0,lex:0,parse:0,semantic:0,lower:0,taint:0,findings:0,codegen:0,verify:0},totalDurationMs:0},limitations:[]};
}
export class AnalysisClient {
 private sequence=0;private active:{worker:Worker;request:AnalyzeRequest;timer:ReturnType<typeof setTimeout>}|null=null;
 constructor(private readonly onProgress:(p:AnalysisProgress)=>void,private readonly onResult:(r:AnalysisResult)=>void,private readonly factory:()=>Worker=()=>new Worker(new URL('../workers/analysis.worker.ts',import.meta.url),{type:'module'})){}
 nextId():string{return `analysis-${++this.sequence}`;}
 start(request:AnalyzeRequest):void {
  this.cancel(false);let worker:Worker;try{worker=this.factory();}catch{this.onResult(failedAnalysis(request,'WORKER_FAILED'));return;}
  const token={worker,request,timer:setTimeout(()=>finish(failedAnalysis(request,'LIMIT_COMPILE_TIME')),10250)};
  this.active=token;
  const finish=(result:AnalysisResult)=>{if(this.active!==token)return;this.active=null;clearTimeout(token.timer);worker.terminate();this.onResult(result);};
  worker.onmessage=event=>{if(this.active!==token)return;const parsed=AnalysisMessageSchema.safeParse(event.data);if(!parsed.success){finish(failedAnalysis(request,'WORKER_FAILED'));return;}
   const message=parsed.data;if(message.requestId!==request.requestId){finish(failedAnalysis(request,'WORKER_FAILED'));return;}
   if(message.type==='progress'){if(message.revision!==request.snapshot.revision){finish(failedAnalysis(request,'WORKER_FAILED'));return;}this.onProgress(message);}
   else{const snap=message.snapshot;if(!snap||snap.snapshotId!==request.snapshot.snapshotId||snap.sha256!==request.snapshot.sha256||snap.source!==request.snapshot.source||snap.revision!==request.snapshot.revision){finish(failedAnalysis(request,'WORKER_FAILED'));return;}finish(message);}
  };
  worker.onerror=worker.onmessageerror=()=>finish(failedAnalysis(request,'WORKER_FAILED'));
  try{worker.postMessage(request);}catch{finish(failedAnalysis(request,'WORKER_FAILED'));}
 }
 cancel(notify=true):void {const token=this.active;if(!token)return;this.active=null;clearTimeout(token.timer);token.worker.terminate();if(notify)this.onResult(failedAnalysis(token.request,'CANCELLED'));}
}
