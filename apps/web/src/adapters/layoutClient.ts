import { DEFAULT_LIMITS, LayoutResultSchema, type LoweredProgram } from '@flowguard/core';
export class LayoutClient {
 private sequence=0;private active:{worker:Worker;timer:ReturnType<typeof setTimeout>}|null=null;
 constructor(private readonly onResult:(snapshotId:string,positions:Record<string,{x:number;y:number}>)=>void,private readonly onError:(snapshotId:string,message:string)=>void,private readonly factory:()=>Worker=()=>new Worker(new URL('../workers/layout.worker.ts',import.meta.url),{type:'module'})){}
 start(snapshotId:string,program:LoweredProgram):void {
  this.cancel();if(program.instructions.length>DEFAULT_LIMITS.maxInteractiveGraphNodes){this.onError(snapshotId,'Large graph: using the searchable node and edge list.');return;}
  const requestId=`layout-${++this.sequence}`;let worker:Worker;try{worker=this.factory();}catch{this.onError(snapshotId,'Layout unavailable: using the node and edge list.');return;}
  const token={worker,timer:setTimeout(()=>fail(),2000)};this.active=token;
  const done=()=>{this.active=null;clearTimeout(token.timer);worker.terminate();};
  const fail=()=>{if(this.active!==token)return;done();this.onError(snapshotId,'Layout failed: using the node and edge list.');};
  worker.onmessage=event=>{if(this.active!==token)return;const parsed=LayoutResultSchema.safeParse(event.data);if(!parsed.success){fail();return;}const r=parsed.data;
   if(r.requestId!==requestId||r.snapshotId!==snapshotId||Object.keys(r.positions).length!==program.instructions.length||program.instructions.some(n=>!r.positions[n.id])){fail();return;}done();this.onResult(snapshotId,r.positions);
  };worker.onerror=worker.onmessageerror=fail;try{worker.postMessage({type:'layout',protocolVersion:1,requestId,snapshotId,program});}catch{fail();}
 }
 cancel():void{const token=this.active;this.active=null;if(token){clearTimeout(token.timer);token.worker.terminate();}}
}
