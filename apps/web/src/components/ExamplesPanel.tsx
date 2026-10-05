import { ExampleProgramSchema } from '@flowguard/core';
import catalog from '../../../../examples/catalog.json';
const sources=import.meta.glob('../../../../examples/*.fg',{query:'?raw',import:'default',eager:true}) as Record<string,string>;
const examples=catalog.map(entry=>ExampleProgramSchema.parse(entry));
export function ExamplesPanel({onLoad}:{onLoad:(source:string,filename:string)=>void}){return <section className="page-panel"><h2>Examples</h2><p>These synthetic programs demonstrate the planned language and analysis. Findings and runtime outcomes are expected behavior, not completed analysis results.</p><div className="examples-grid">{examples.map(example=><article key={example.id}><h3>{example.title}</h3><p>{example.purpose}</p><button onClick={()=>onLoad(sources[`../../../../examples/${example.filename}`]!,example.filename)}>Load {example.title}</button></article>)}</div></section>;}
