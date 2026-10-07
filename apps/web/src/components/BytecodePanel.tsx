import { useState } from 'react';
import type { BytecodeArtifact } from '@flowguard/core';
export function BytecodePanel({artifact,lines,selected,onSelect}:{artifact:BytecodeArtifact;lines:string[];selected:number|null;onSelect:(pc:number)=>void}){
 const [page,setPage]=useState(0),last=Math.max(0,Math.ceil(lines.length/100)-1),safePage=Math.min(page,last);
 return <section className="bytecode-panel"><h2>Verified bytecode</h2><p className="panel-note">{lines.length} instructions · maximum stack {artifact.maxVerifiedStack}. Select a PC to inspect its source and graph node.</p><div className="bytecode-rows">{lines.slice(safePage*100,safePage*100+100).map((line,index)=>{const pc=safePage*100+index;return <button key={pc} aria-pressed={selected===pc} onClick={()=>onSelect(pc)}><code>{line}</code></button>;})}</div><div className="pagination"><button disabled={safePage===0} onClick={()=>setPage(safePage-1)}>Previous bytecode</button><button disabled={safePage===last} onClick={()=>setPage(safePage+1)}>Next bytecode</button></div></section>;
}
