import { chromium } from '@playwright/test';
import { evidence,analyze,hash,machine } from './evidence.js';
import { workloads,graphWorkload,SEED,p95 } from './workloads.js';
const results=[];
for(const fixture of workloads()){
 const warm=analyze(fixture.source,fixture.id);if(warm.status!=='completed')throw new Error(`${fixture.id}: ${warm.status} ${warm.diagnostics.map(d=>d.code)}`);
 const lines=fixture.source.split(/\r\n|\r|\n/).filter(s=>s.trim()).length,nodes=warm.statistics.cfgNodeCount,sources=warm.statistics.inputSourceCount;if(lines>1000||nodes>500||sources>50)throw new Error('Benchmark exceeds approved workload bounds.');
 const samples=[];for(let i=0;i<10;i++){const start=performance.now(),r=analyze(fixture.source,fixture.id),durationMs=performance.now()-start;if(r.status!=='completed')throw new Error(`Incomplete timed run: ${r.status}`);samples.push({durationMs,stageDurationsMs:r.statistics.stageDurationsMs,status:r.status});}
 console.log(`${fixture.id}: ${p95(samples.map(s=>s.durationMs)).toFixed(1)} ms p95`);results.push({id:fixture.id,source:fixture.source,sha256:hash(fixture.source),lines,nodes,sources,warmupMs:warm.statistics.totalDurationMs,samples,p95Ms:p95(samples.map(s=>s.durationMs))});
}
await evidence('benchmark-engine',{schemaVersion:1,seed:SEED,machine:machine(),results});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:800}}),browserVersion=browser.version();
const graphSource=graphWorkload(),graph=analyze(graphSource,'graph-benchmark');if(graph.statistics.cfgNodeCount!==200)throw new Error('Expected exactly 200 nodes.');
async function edit(source:string){await page.getByRole('textbox',{name:'Write a FlowGuard program'}).focus();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.insertText(source);}
async function graphReady(previous:string|null){await page.waitForFunction(previous=>document.querySelectorAll('.react-flow__node').length===200&&[...document.querySelectorAll('[role="status"]')].some(e=>e.textContent==='Analysis: completed'&&e.getAttribute('data-analysis-request-id')!==previous),previous);}
const readiness:number[]=[],selection:number[]=[],cancellation:number[]=[],analysisCancellation:number[]=[],layout:number[]=[];
try{
 await page.goto('http://127.0.0.1:4173/');await edit(graphSource);
 for(let i=-1;i<10;i++){
  // Start at the browser input event; readiness includes hashing, compilation,
  // worker transport, Dagre layout and visible node rendering.
  await page.evaluate(()=>{const target=[...document.querySelectorAll('button')].find(b=>b.textContent==='Analyze')!;target.addEventListener('click',()=>{const w=window as unknown as {fgStart:number;fgCompleted:number;fgRendered:number};w.fgStart=performance.now();w.fgCompleted=0;w.fgRendered=0;const observer=new MutationObserver(()=>{const completed=[...document.querySelectorAll('[data-analysis-request-id]')].some(e=>e.textContent==='Analysis: completed');if(completed&&!w.fgCompleted)w.fgCompleted=performance.now();if(w.fgCompleted&&document.querySelectorAll('.react-flow__node').length===200&&!w.fgRendered){w.fgRendered=performance.now();observer.disconnect();}});observer.observe(document.querySelector('main')!,{subtree:true,childList:true,attributes:true,characterData:true});},{once:true});});
  const previous=await page.evaluate(()=>document.querySelector('[data-analysis-request-id]')?.getAttribute('data-analysis-request-id')??null);await page.getByRole('button',{name:'Analyze',exact:true}).click();await graphReady(previous);const ms=await page.evaluate(()=>performance.now()-(window as unknown as {fgStart:number}).fgStart);if(i>=0){readiness.push(ms);layout.push(await page.evaluate(()=>{const w=window as unknown as {fgCompleted:number;fgRendered:number};return w.fgRendered-w.fgCompleted;}));}
  const node=page.locator('.bytecode-rows button').first();await page.evaluate(()=>{document.querySelector('.bytecode-rows button')!.addEventListener('click',()=>{(window as unknown as {fgSelect:number}).fgSelect=performance.now();},{once:true});});await node.click();await page.waitForFunction(()=>document.querySelector('.source-selection')!==null);if(i>=0)selection.push(await page.evaluate(()=>performance.now()-(window as unknown as {fgSelect:number}).fgSelect));
 }
 await edit(Array.from({length:900},(_,i)=>`let v${i}:int=${i};print(v${i});`).join('\n'));
 for(let i=-1;i<10;i++){await page.getByRole('button',{name:'Analyze',exact:true}).click();await page.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>b.textContent==='Cancel analysis')!.addEventListener('click',()=>{(window as unknown as {fgAnalysisCancel:number}).fgAnalysisCancel=performance.now();},{once:true});});await page.getByRole('button',{name:'Cancel analysis',exact:true}).click();await page.waitForFunction(()=>document.querySelector('footer[data-analysis-status=cancelled]')!==null);if(i>=0)analysisCancellation.push(await page.evaluate(()=>performance.now()-(window as unknown as {fgAnalysisCancel:number}).fgAnalysisCancel));}
 // Cancellation starts at Stop's browser click; it measures the visible state,
 // independent of worker computation duration. A real bounded VM loop is used.
 await edit('while(true){}');await page.getByRole('button',{name:'Analyze',exact:true}).click();await page.getByText('Analysis: completed',{exact:true}).waitFor();
 for(let i=-1;i<10;i++){
  // Trigger Stop as soon as React exposes it. The bounded loop can finish before
  // Playwright's actionability/scroll checks; the measurement starts at the real
  // DOM click handler and does not include test-driver waiting.
  await page.evaluate(()=>new Promise<void>(resolve=>{const observer=new MutationObserver(()=>{const stop=[...document.querySelectorAll('button')].find(b=>b.textContent==='Stop execution');if(stop){observer.disconnect();(window as unknown as {fgCancel:number}).fgCancel=performance.now();stop.click();resolve();}});observer.observe(document.querySelector('main')!,{subtree:true,childList:true});[...document.querySelectorAll('button')].find(b=>b.textContent==='Run')!.click();}));
  await page.getByText('Execution: cancelled',{exact:true}).waitFor();if(i>=0)cancellation.push(await page.evaluate(()=>performance.now()-(window as unknown as {fgCancel:number}).fgCancel));
 }
}finally{await browser.close();}
const engineP95=p95(results.flatMap(r=>r.samples.map(s=>s.durationMs))),graphP95=p95(readiness),selectionP95=p95(selection),cancelP95=p95(cancellation),analysisCancelP95=p95(analysisCancellation),layoutP95=p95(layout);
const targets={engineMs:2000,graphMs:2000,selectionMs:250,cancellationMs:250};const passed=engineP95<=2000&&results.every(r=>r.p95Ms<=2000)&&graphP95<=2000&&selectionP95<=250&&cancelP95<=250&&analysisCancelP95<=250;
await evidence('benchmark',{schemaVersion:1,seed:SEED,machine:machine(),browser:{name:'Playwright Chromium',version:browserVersion,viewport:{width:1280,height:800}},procedure:'One warm-up plus 10 measured runs per engine fixture; nearest-rank p95. Browser click-to-visible timings include scheduling and measurement overhead; graph readiness includes full analysis.',results,browserSamples:{graph:{source:graphSource,sha256:hash(graphSource),nodes:200,readinessMs:readiness,layoutAndRenderMs:layout},selectionMs:selection,cancellationMs:cancellation,analysisCancellationMs:analysisCancellation},summary:{engineP95,graphP95,layoutP95,selectionP95,cancelP95,analysisCancelP95,targets,passed}});console.log(JSON.stringify({engineP95,graphP95,layoutP95,selectionP95,cancelP95,analysisCancelP95,passed}));if(!passed)process.exitCode=1;
