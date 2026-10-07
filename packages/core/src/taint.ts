import type { LoweredProgram, SerializedState, TaintResult } from './model.js';
import type { BudgetGuard } from './limits.js';
import { adjacency } from './graph.js';
import type { ReplayRecorder } from './replay.js';

type Sources=readonly number[];
interface State {reachable:boolean;slots:readonly Sources[]}
const EMPTY:Sources=Object.freeze([]);
export function unionSources(a:Sources,b:Sources):Sources {
 if(!a.length)return b;if(!b.length)return a;
 const result:number[]=[];let i=0,j=0;
 while(i<a.length||j<b.length){const x=a[i]??Infinity,y=b[j]??Infinity;if(x<=y){result.push(x);i++;if(x===y)j++;}else{result.push(y);j++;}}
 return result;
}
function equal(a:Sources,b:Sources){return a===b||a.length===b.length&&a.every((x,i)=>x===b[i]);}
function same(a:State,b:State){return a.reachable===b.reachable&&a.slots.length===b.slots.length&&a.slots.every((x,i)=>equal(x,b.slots[i]!));}
function memberships(s:State){return s.slots.reduce((n,ids)=>n+ids.length,0);}
const index=(id:string)=>Number(id.slice(id.indexOf('-')+1));
function serialize(s:State,p:LoweredProgram):SerializedState{return {reachable:s.reachable,entries:s.reachable?p.slots.map((slot,i)=>({slotId:slot.id,sourceIds:s.slots[i]!.map(n=>`src-${n}`)})):[]};}

export function solveTaint(program:LoweredProgram,guard:BudgetGuard,recorder?:ReplayRecorder,onProgress?:(count:number)=>void):TaintResult {
 const nodes=program.instructions,count=nodes.length,slotCount=program.slots.length;
 guard.checkCount('maxStateCells',2*count*slotCount,'LIMIT_ANALYSIS_STORAGE','taint');guard.checkpoint('taint',true);
 const {predecessors,successors}=adjacency(program),unreached:State={reachable:false,slots:[]};
 const ins:State[]=Array(count).fill(unreached),outs:State[]=Array(count).fill(unreached);
 let retained=0,pops=0,updates=0,head=0;
 let queue:number[]=[index(program.entryNodeId)];const queued=Array<boolean>(count).fill(false);queued[queue[0]!]=true;
 const retain=(old:State,next:State)=>{const n=retained-memberships(old)+memberships(next);guard.checkCount('maxSourceMemberships',n,'LIMIT_ANALYSIS_STORAGE','taint');retained=n;};
 while(head<queue.length){const n=queue[head++]!;queued[n]=false;const node=nodes[n]!;
  guard.checkCount('maxSolverVisits',++pops,'LIMIT_SOLVER','taint');guard.checkpoint('taint');if(pops%256===0)onProgress?.(pops);
  let reached=node.id===program.entryNodeId;const slots:Sources[]=Array(slotCount).fill(EMPTY);
  for(const edge of predecessors.get(node.id)!){const before=outs[index(edge.from)]!;if(!before.reachable)continue;reached=true;for(let i=0;i<slotCount;i++){guard.checkpoint('taint');slots[i]=unionSources(slots[i]!,before.slots[i]!);}}
  const incoming:State=reached?{reachable:true,slots}:unreached;
  let outgoing=incoming;
  if(reached&&'dst' in node){const next=slots.slice(),dst=index(node.dst);
   switch(node.op){case 'const':next[dst]=EMPTY;break;case 'input':next[dst]=[index(node.sourceId)];break;case 'copy':case 'unary':next[dst]=slots[index(node.src)]!;break;case 'binary':next[dst]=unionSources(slots[index(node.left)]!,slots[index(node.right)]!);break;}
   outgoing={reachable:true,slots:next};
  }
  retain(ins[n]!,incoming);ins[n]=incoming;
  if(!same(outs[n]!,outgoing)){retain(outs[n]!,outgoing);if(recorder)recorder.record(node.id,serialize(outs[n]!,program),serialize(outgoing,program));outs[n]=outgoing;updates++;
   const next=successors.get(node.id)!.map(e=>index(e.to)).sort((a,b)=>a-b);for(const target of next)if(!queued[target]){queued[target]=true;queue.push(target);}
  }
  if(head>4096){queue=queue.slice(head);head=0;}
 }
 guard.checkpoint('taint',true);
 const states:TaintResult['states']={};nodes.forEach((node,n)=>{guard.checkpoint('taint');states[node.id]={in:serialize(ins[n]!,program),out:serialize(outs[n]!,program)};});
 return {states,processedNodeCount:pops,updateCount:updates,reachedNodeIds:nodes.filter((_,n)=>outs[n]!.reachable).map(n=>n.id)};
}
