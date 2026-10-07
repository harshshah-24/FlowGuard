import { runBytecode, type ExecutionRequest } from '@flowguard/core';
const scope=self as unknown as {onmessage:((event:MessageEvent)=>void)|null;postMessage:(value:unknown)=>void};
scope.onmessage=event=>scope.postMessage(runBytecode(event.data as ExecutionRequest,{nowMs:()=>performance.now()}));
