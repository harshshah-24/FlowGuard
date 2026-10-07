// Fixed, reproducible workload generation; no observed result selects a workload.
export const SEED=5012026;
export function workloads(){let state=SEED;const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};return Array.from({length:20},(_,index)=>{
 const count=75+next()%50,rows=['let value:string=input("Synthetic input");','let n:int=0;'];
 for(let i=0;i<count;i++){if(index%4===0&&i%10===0)rows.push('if(n<50){n=n+1;}else{n=n+2;}');else if(index%4===1&&i%12===0)rows.push('while(n<2){n=n+1;}');else if(index%4===2&&i%15===0)rows.push('value=value+"x";');else rows.push(`n=n+${1+next()%3};`);}
 rows.push(index%2?'sql_bind("SELECT ?",value);':'sql_query(value);');rows.push('print(n);');return {id:`benchmark-${index.toString().padStart(2,'0')}`,source:rows.join('\n')+'\n'};
 });}
export function graphWorkload(){const rows=Array.from({length:66},(_,i)=>`let n${i}:int=${i};print(n${i});`);rows.push('print(n0);');return rows.join('\n');} // 200 actual lowered nodes.
export function p95(values:number[]){if(!values.length)throw new Error('No timing samples.');return [...values].sort((a,b)=>a-b)[Math.ceil(0.95*values.length)-1]!;}
