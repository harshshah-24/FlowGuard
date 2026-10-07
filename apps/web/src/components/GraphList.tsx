import { useState } from 'react';
import type { LoweredProgram } from '@flowguard/core';
export function GraphList({program,selected,onSelect}:{program:LoweredProgram;selected:string|null;onSelect:(id:string)=>void}){
 const [query,setQuery]=useState(''),[page,setPage]=useState(0);const matches=program.instructions.filter(n=>`${n.id} ${n.op} ${n.span.startLine}`.includes(query)),start=Math.min(page,Math.max(0,Math.ceil(matches.length/100)-1))*100;
 return <div className="graph-list"><label>Search nodes <input value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}}/></label><p>{matches.length} nodes · All semantic edges retained</p>
  {matches.slice(start,start+100).map(n=><article key={n.id}><button aria-pressed={selected===n.id} onClick={()=>onSelect(n.id)}>{n.id}: {n.op} · line {n.span.startLine}</button><ul>{program.edges.filter(e=>e.from===n.id).map(e=><li key={e.id}><button onClick={()=>onSelect(e.to)}>{e.kind} → {e.to}</button></li>)}</ul></article>)}
  <button disabled={start===0} onClick={()=>setPage(page-1)}>Previous nodes</button><button disabled={start+100>=matches.length} onClick={()=>setPage(page+1)}>Next nodes</button>
 </div>;
}
