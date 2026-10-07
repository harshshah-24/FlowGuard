import { useState } from 'react';
import { reconstructReplay, type AnalysisResult, type ReplayTrace, type TaintResult } from '@flowguard/core';
type Artifacts=AnalysisResult['artifacts'];
export function InspectorPanel({artifacts,nodeId,replay,trace,taint}:{artifacts:Artifacts;nodeId:string|null;replay:number|null;trace?:ReplayTrace|undefined;taint?:TaintResult|undefined}){
 const [tab,setTab]=useState('states'),[page,setPage]=useState(0);let rows:unknown[]=[];
 if(tab==='tokens')rows=artifacts.tokens??[];
 if(tab==='ast'){const stack=artifacts.ast?[artifacts.ast]:[];while(stack.length){const node=stack.pop()! as unknown as Record<string,unknown>;const children=Object.values(node).flatMap(v=>Array.isArray(v)?v:v&&typeof v==='object'&&'kind' in v?[v]:[]).filter((v):v is typeof artifacts.ast=>!!v&&typeof v==='object'&&'kind' in v);const ref=(v:unknown)=>v&&typeof v==='object'&&'kind' in v&&'id' in v?{ref:v.id}:v;rows.push(Object.fromEntries(Object.entries(node).map(([key,value])=>[key,Array.isArray(value)?value.map(ref):ref(value)])));for(let i=children.length-1;i>=0;i--)stack.push(children[i]!);}}
 if(tab==='symbols')rows=artifacts.semantic?.symbols??[];
 if(tab==='states'){const replayOutputs=replay!==null&&trace?reconstructReplay(trace,replay):null;
  if(nodeId){const state=taint?.states[nodeId],out=replayOutputs?.[nodeId]??state?.out,incoming=replayOutputs?undefined:state?.in;const before=new Map(incoming?.entries.map(e=>[e.slotId,e.sourceIds])??[]);rows=(out?.entries??[]).map(e=>({nodeId,slotId:e.slotId,...(incoming?{inSources:before.get(e.slotId)??[]}:{}),outSources:e.sourceIds}));if(!out?.reachable)rows=[{nodeId,reachable:false}];}
  else rows=Object.entries(taint?.states??{}).map(([id,state])=>{const out=replayOutputs?.[id]??state.out;return {nodeId:id,reachable:out.reachable,taintedSlots:out.entries.filter(e=>e.sourceIds.length).length};});
 }
 const safePage=Math.min(page,Math.max(0,Math.ceil(rows.length/100)-1));
 return <><h2>Inspection</h2><div role="tablist" aria-label="Compiler artifacts">{['tokens','ast','symbols','states'].map(name=><button key={name} role="tab" aria-selected={tab===name} onClick={()=>{setTab(name);setPage(0);}}>{name}</button>)}</div><p className="panel-note">{replay===null?'Final static states':`Analysis update ${replay+1}`} · {rows.length} rows</p><div role="tabpanel" className="inspection-rows">{rows.slice(safePage*100,safePage*100+100).map((row,i)=>{const r=row as Record<string,unknown>;return <details key={i}><summary>{String(r.slotId??r.id??r.nodeId??i)} {String(r.kind??'')}</summary><pre>{JSON.stringify(row,null,2)}</pre></details>;})}</div><div className="pagination"><button disabled={safePage===0} onClick={()=>setPage(safePage-1)}>Previous rows</button><button disabled={(safePage+1)*100>=rows.length} onClick={()=>setPage(safePage+1)}>Next rows</button></div></>;
}
