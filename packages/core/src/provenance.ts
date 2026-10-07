import { adjacency } from './graph.js';
import type { BudgetGuard } from './limits.js';
import type { ExplanationFact, Finding, LoweredProgram, TaintResult } from './model.js';

export function buildProvenance(program:LoweredProgram,states:TaintResult,findings:Finding[],guard:BudgetGuard):ExplanationFact[] {
 const {predecessors}=adjacency(program),nodes=new Map(program.instructions.map(n=>[n.id,n]));
 const facts:ExplanationFact[]=[],cache=new Map<string,string>();
 const has=(nodeId:string,slotId:string,sourceId:string)=>states.states[nodeId]?.out.entries.find(e=>e.slotId===slotId)?.sourceIds.includes(sourceId)??false;
 const deps=(nodeId:string,slotId:string,sourceId:string)=>{
  const node=nodes.get(nodeId)!;
  if('dst' in node&&node.dst===slotId){if(node.op==='const'||node.op==='input')return [];
   const operands=node.op==='binary'?[node.left,node.right]:'src' in node?[node.src]:[];
   return predecessors.get(nodeId)!.flatMap(edge=>operands.filter(slot=>has(edge.from,slot,sourceId)).map(slot=>({nodeId:edge.from,slotId:slot})));
  }
  return predecessors.get(nodeId)!.filter(edge=>has(edge.from,slotId,sourceId)).map(edge=>({nodeId:edge.from,slotId}));
 };
 for(const finding of findings){const visible=new Set<string>();let complete=true;
  const include=(id:string)=>{if(visible.size<guard.limits.maxExplanationFacts)visible.add(id);else if(!visible.has(id))complete=false;};
  for(const sourceId of finding.sourceIds){const sink=nodes.get(finding.sinkNodeId)!;if(sink.op!=='effect')continue;
   type Task={nodeId:string;slotId:string;parent?:string;exit?:boolean};
   const active=new Set<string>(),expanded=new Set<string>(),stack:Task[]=predecessors.get(sink.id)!.filter(e=>has(e.from,sink.argSlots[0]!,sourceId)).reverse().map(e=>({nodeId:e.from,slotId:sink.argSlots[0]!}));
   while(stack.length){guard.checkpoint('findings');const task=stack.pop()!,key=`${task.nodeId}:${task.slotId}:${sourceId}`;
    if(task.exit){active.delete(key);continue;}
    const cycle=active.has(key),cacheKey=cycle?`${key}:cycle`:key;let id=cache.get(cacheKey);
    if(!id){if(facts.length>=guard.limits.maxProvenanceFacts){complete=false;continue;}
     id=`fact-${facts.length}`;cache.set(cacheKey,id);const node=nodes.get(task.nodeId)!;
     const kind=cycle?'cycle':node.op==='input'&&node.dst===task.slotId?'source':node.op==='copy'&&node.dst===task.slotId?'copy':(node.op==='binary'||node.op==='unary')&&node.dst===task.slotId?'operator':'merge';
     facts.push({id,nodeId:node.id,slotId:task.slotId,sourceId,predecessorFactIds:[],kind,span:node.span});
    }
    include(id);if(task.parent){const parent=facts[Number(task.parent.slice(5))]!;if(!parent.predecessorFactIds.includes(id))parent.predecessorFactIds.push(id);}
    if(cycle||expanded.has(key))continue;
    // Traverse cached dependencies too, so each finding receives its own closure.
    expanded.add(key);active.add(key);stack.push({...task,exit:true});
    const children=deps(task.nodeId,task.slotId,sourceId);
    for(let i=children.length-1;i>=0;i--)stack.push({...children[i]!,parent:id});
   }
  }
  finding.explanationFactIds=[...visible];finding.explanationComplete=complete;
 }
 guard.checkpoint('findings',true);return facts;
}
