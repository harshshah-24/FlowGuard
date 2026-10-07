import { ExecutionMessageSchema, DEFAULT_LIMITS, makeDiagnostic, type ExecutionRequest, type ExecutionResult } from '@flowguard/core';
export function failedExecution(request:ExecutionRequest,code:'WORKER_FAILED'|'LIMIT_VM_TIME'|'CANCELLED'):ExecutionResult {
 return {schemaVersion:1,requestId:request.requestId,snapshotId:request.snapshotId,revision:request.revision,status:code==='CANCELLED'?'cancelled':code==='LIMIT_VM_TIME'?'incomplete-limit':'internal-error',diagnostics:[makeDiagnostic(code,'runtime',code==='CANCELLED'?'Execution cancelled.':code==='LIMIT_VM_TIME'?'Execution worker exceeded its deadline.':'Execution worker failed. Please retry.')],events:[],consumedInputCount:0,instructionCount:0,elapsedMs:code==='LIMIT_VM_TIME'?1250:0,finalTopLevelValues:[],limits:DEFAULT_LIMITS};
}
export class ExecutionClient {
 private sequence=0;private active:{worker:Worker;request:ExecutionRequest;timer:ReturnType<typeof setTimeout>}|null=null;
 constructor(private readonly onResult:(r:ExecutionResult)=>void,private readonly factory:()=>Worker=()=>new Worker(new URL('../workers/execution.worker.ts',import.meta.url),{type:'module'})){}
 nextId():string{return `execution-${++this.sequence}`;}
 start(request:ExecutionRequest):void {
  this.cancel(false);let worker:Worker;try{worker=this.factory();}catch{this.onResult(failedExecution(request,'WORKER_FAILED'));return;}
  const finish=(result:ExecutionResult)=>{if(this.active!==token)return;this.active=null;clearTimeout(token.timer);worker.terminate();this.onResult(result);};
  const token={worker,request,timer:setTimeout(()=>finish(failedExecution(request,'LIMIT_VM_TIME')),1250)};this.active=token;
  worker.onmessage=event=>{if(this.active!==token)return;const parsed=ExecutionMessageSchema.safeParse(event.data);if(!parsed.success){finish(failedExecution(request,'WORKER_FAILED'));return;}const r=parsed.data;if(r.requestId!==request.requestId||r.snapshotId!==request.snapshotId||r.revision!==request.revision)return;finish(r);};
  worker.onerror=worker.onmessageerror=()=>finish(failedExecution(request,'WORKER_FAILED'));
  try{worker.postMessage(request);}catch{finish(failedExecution(request,'WORKER_FAILED'));}
 }
 cancel(notify=true):void {const token=this.active;if(!token)return;this.active=null;clearTimeout(token.timer);token.worker.terminate();if(notify)this.onResult(failedExecution(token.request,'CANCELLED'));}
}
