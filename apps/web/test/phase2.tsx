// Test-build entry only. Every artifact below comes from the real static engine.
// No completed AnalysisResult/bytecode/VM is fabricated for presentation checks.
import { useEffect,useMemo,useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BudgetGuard,lex,parse,checkSemantics,lowerProgram,solveTaint,collectFindings,buildProvenance,ReplayRecorder,type AnalysisResult,type Finding,type ExplanationFact,type SourceSnapshot } from '@flowguard/core';
import { createSnapshot } from '../src/adapters/snapshot.js';
import { LayoutClient } from '../src/adapters/layoutClient.js';
import { GraphPanel } from '../src/components/GraphPanel.js';
import { FindingsPanel } from '../src/components/FindingsPanel.js';
import { InspectorPanel } from '../src/components/InspectorPanel.js';
import { ReplayControls } from '../src/components/ReplayControls.js';
import { SourceEditor } from '../src/components/SourceEditor.js';
import { useWorkspace } from '../src/workspace/useWorkspace.js';
import { App } from '../src/App.js';
import '../src/styles.css';
const unsafe='let name:string=input("Name");\nsql_query(name);',bound='let name:string=input("Name");\nsql_bind("SELECT ?",name);';
interface StaticData {snapshot:SourceSnapshot;artifacts:AnalysisResult['artifacts'];findings:Finding[];explanations:ExplanationFact[]}
function Harness(){
 const [source,setSource]=useState(unsafe),[data,setData]=useState<StaticData|null>(null),[error,setError]=useState(''),[node,setNode]=useState<string|null>(null),[finding,setFinding]=useState<string|null>(null),[index,setIndex]=useState(-1),[final,setFinal]=useState(true),[positions,setPositions]=useState<Record<string,{x:number;y:number}>>({}),[status,setStatus]=useState('idle'),[notice,setNotice]=useState(''),[playing,setPlaying]=useState(false),[fallback,setFallback]=useState(false);
 const client=useMemo(()=>new LayoutClient((_,p)=>{setPositions(p);setStatus('ready');},(_,message)=>{setNotice(message);setStatus('error');}),[]);
 const worker=useWorkspace();
 const compile=async()=>{client.cancel();setData(null);setError('');setNode(null);setFinding(null);setFinal(true);setIndex(-1);setPlaying(false);try{const snapshot=await createSnapshot(source,'test.fg',0),guard=new BudgetGuard({nowMs:()=>performance.now()}),tokens=lex(snapshot,guard),ast=parse(tokens,snapshot,guard),semantic=checkSemantics(ast,snapshot,guard),lowered=lowerProgram(ast,semantic,guard),recorder=new ReplayRecorder(lowered),taint=solveTaint(lowered,guard,recorder),findings=collectFindings(lowered,taint,semantic),explanations=buildProvenance(lowered,taint,findings,guard);setData({snapshot,artifacts:{tokens,ast,semantic,lowered,taint,replay:recorder.trace},findings,explanations});setStatus('running');client.start(snapshot.snapshotId,lowered);}catch(error){setError(error instanceof Error?error.message:'Static test failed.');}};
 useEffect(()=>{void compile();return ()=>client.cancel();},[]);
 return <main><h1>Phase 2 development artifacts</h1><p>Static-module integration only. No completed Analyze or execution result.</p><label>Test source<textarea value={source} onChange={e=>{setSource(e.target.value);setData(null);client.cancel();}}/></label><button onClick={()=>void compile()}>Compile static modules</button><button onClick={()=>{setSource(bound);setData(null);client.cancel();}}>Use binding</button><button onClick={()=>setFallback(!fallback)}>Force layout fallback (test only)</button><p role="alert" data-testid="static-error">{error}</p><p role="status">{notice||status}</p>
 {data&&<><div className="workspace"><section><SourceEditor source={data.snapshot.source} onChange={()=>{}} highlight={data.artifacts.lowered?.sourceMap[node??'']}/></section><section><GraphPanel program={data.artifacts.lowered!} positions={positions} status={fallback?'error':status} selected={node} onSelect={setNode} partial/></section><section><FindingsPanel findings={data.findings} explanations={data.explanations} semantic={data.artifacts.semantic!} selected={finding} onSelect={f=>{setFinding(f.id);setNode(f.sinkNodeId);}}/><InspectorPanel artifacts={data.artifacts} taint={data.artifacts.taint} trace={data.artifacts.replay} nodeId={node} replay={final?null:index}/></section></div><ReplayControls trace={data.artifacts.replay!} index={index} final={final} playing={playing} onIndex={i=>{setIndex(i);setFinal(false);}} onFinal={()=>setFinal(true)} onPlay={setPlaying}/></>}
 <section aria-label="Worker integration"><h2>Real analysis worker</h2><button onClick={()=>worker.dispatch({type:'EDIT_SOURCE',source})}>Capture worker source</button><button onClick={()=>void worker.analyze()}>Start static worker</button><button onClick={worker.cancel}>Stop static worker</button><p data-testid="worker-status">{worker.state.analysisStatus}</p><p data-testid="worker-stages">{worker.state.currentAnalysis?.completedStages.join(', ')}</p><button onClick={()=>worker.exportReport('json')}>Download worker JSON</button><button onClick={()=>worker.exportReport('markdown')}>Download worker Markdown</button></section><hr/><App/></main>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
