import type { LoweredProgram, ReplayEvent, ReplayTrace, SerializedState } from './model.js';
import { DEFAULT_LIMITS } from './limits.js';
import { jsonBytes } from './json.js';

export function applyReplayEvent(outputs:Record<string,SerializedState>,event:ReplayEvent,undo=false):Record<string,SerializedState> {
 const before=outputs[event.nodeId]??{reachable:false,entries:[]};const entries=new Map(before.entries.map(e=>[e.slotId,e.sourceIds]));
 for(const change of event.changes)entries.set(change.slotId,undo?change.beforeSources:change.afterSources);
 const reachable=undo?event.reachableBefore:event.reachableAfter;
 return {...outputs,[event.nodeId]:{reachable,entries:reachable?[...entries].sort(([a],[b])=>Number(a.slice(5))-Number(b.slice(5))).map(([slotId,sourceIds])=>({slotId,sourceIds})):[]}};
}
export class ReplayRecorder {
 readonly trace:ReplayTrace={events:[],checkpoints:[],truncated:false,droppedEventCount:0};
 private bytes=128;private outputs:Record<string,SerializedState>={};
 constructor(program:LoweredProgram){for(const node of program.instructions)this.outputs[node.id]={reachable:false,entries:[]};this.retainCheckpoint(-1);}
 private fits(value:unknown):number|null {try{return jsonBytes(value,DEFAULT_LIMITS.maxReplayBytes-this.bytes)+1;}catch{return null;}}
 private retainCheckpoint(eventIndex:number):boolean {const checkpoint={eventIndex,outputs:this.outputs};const size=this.fits(checkpoint);if(size===null||this.bytes+size>DEFAULT_LIMITS.maxReplayBytes)return false;this.bytes+=size;this.trace.checkpoints.push(checkpoint);return true;}
 record(nodeId:string,before:SerializedState,after:SerializedState):void {
  const drop=()=>{this.trace.truncated=true;this.trace.droppedEventCount++;};
  if(this.trace.truncated||this.trace.events.length>=DEFAULT_LIMITS.maxReplayEvents){drop();return;}
  const old=new Map(before.entries.map(e=>[e.slotId,e.sourceIds]));
  const changes=after.entries.filter(e=>{const prev=old.get(e.slotId)??[];return !before.reachable||prev.length!==e.sourceIds.length||prev.some((x,i)=>x!==e.sourceIds[i]);}).map(e=>({slotId:e.slotId,beforeSources:old.get(e.slotId)??[],afterSources:e.sourceIds}));
  const event:ReplayEvent={index:this.trace.events.length,nodeId,changes,reachableBefore:before.reachable,reachableAfter:after.reachable};
  const size=this.fits(event);if(size===null||this.bytes+size>DEFAULT_LIMITS.maxReplayBytes){drop();return;}
  // Immutable outer maps and states: checkpoints share unchanged states safely.
  const next={...this.outputs,[nodeId]:after};
  const checkpointDue=(event.index+1)%DEFAULT_LIMITS.replayCheckpointInterval===0;
  if(checkpointDue){const checkpoint={eventIndex:event.index,outputs:next};let cpSize:number;try{cpSize=jsonBytes(checkpoint,DEFAULT_LIMITS.maxReplayBytes-this.bytes-size)+1;}catch{drop();return;}if(this.bytes+size+cpSize>DEFAULT_LIMITS.maxReplayBytes){drop();return;}this.bytes+=cpSize;this.trace.checkpoints.push(checkpoint);}
  this.bytes+=size;this.trace.events.push(event);this.outputs=next;
 }
}
export function reconstructReplay(trace:ReplayTrace,index:number):Record<string,SerializedState> {
 if(!Number.isInteger(index)||index< -1||index>=trace.events.length)throw new RangeError('Replay index out of range.');
 const checkpoint=[...trace.checkpoints].reverse().find(c=>c.eventIndex<=index);if(!checkpoint)throw new Error('Missing initial replay checkpoint.');
 let outputs=checkpoint.outputs;for(let i=checkpoint.eventIndex+1;i<=index;i++)outputs=applyReplayEvent(outputs,trace.events[i]!);return outputs;
}
