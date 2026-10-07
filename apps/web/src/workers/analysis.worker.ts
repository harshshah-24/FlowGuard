import { analyzeSource, validateAnalysisRequest } from '@flowguard/core';
import type { AnalyzeRequest } from '@flowguard/core';
const scope=self as unknown as {onmessage:((event:MessageEvent)=>void)|null;postMessage:(value:unknown)=>void};
scope.onmessage=event=>{void handle(event.data);};
async function handle(raw:unknown){
 const valid=validateAnalysisRequest(raw);
 if(valid.ok){const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(valid.request.snapshot.source)))].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==valid.request.snapshot.sha256){const result=analyzeSource({}, {nowMs:()=>performance.now()});result.requestId=valid.request.requestId;scope.postMessage(result);return;}
 }
 scope.postMessage(analyzeSource(raw as AnalyzeRequest,{nowMs:()=>performance.now(),onProgress:p=>scope.postMessage(p)}));
}
