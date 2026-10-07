import { useEffect, useState } from 'react';
import type { ReplayTrace } from '@flowguard/core';
export function ReplayControls({trace,index,final,playing,onIndex,onFinal,onPlay}:{trace:ReplayTrace;index:number;final:boolean;playing:boolean;onIndex:(index:number)=>void;onFinal:()=>void;onPlay:(playing:boolean)=>void}){
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),handler=()=>setReduced(media.matches);media.addEventListener('change',handler);return ()=>media.removeEventListener('change',handler);},[]);
 useEffect(()=>{if(reduced&&playing)onPlay(false);},[reduced,playing,onPlay]);
 return <section className="replay-controls" aria-label="Analysis replay"><strong>{final?'Final static analysis':`Analysis update ${index+1}`}</strong><button onClick={()=>onIndex(-1)}>Reset replay</button><button disabled={final||index<0} onClick={()=>onIndex(index-1)}>Previous update</button><button disabled={index>=trace.events.length-1&&!final||!trace.events.length} onClick={()=>onIndex(final?0:index+1)}>Next update</button><button disabled={reduced||!trace.events.length||(!final&&index>=trace.events.length-1)} onClick={()=>onPlay(!playing)}>{playing?'Pause replay':'Play replay'}</button><button onClick={onFinal}>View final analysis</button>{trace.truncated&&<p>Replay truncated ({trace.droppedEventCount} updates omitted). Its final recorded update may differ from convergence.</p>}</section>;
}
