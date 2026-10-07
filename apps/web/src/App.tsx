import { canAnalyze, canRun, canUseCurrentMarks, hasCurrentAnalysis } from './workspace/selectors.js';
import { useWorkspace } from './workspace/useWorkspace.js';
import { SourceEditor } from './components/SourceEditor.js';
import { Toolbar } from './components/Toolbar.js';
import { StatusBar } from './components/StatusBar.js';
import { ExamplesPanel } from './components/ExamplesPanel.js';
import { HelpPanel } from './components/HelpPanel.js';
import { ReplaceSourceDialog } from './components/ReplaceSourceDialog.js';
import { GraphPanel } from './components/GraphPanel.js';
import { FindingsPanel } from './components/FindingsPanel.js';
import { InspectorPanel } from './components/InspectorPanel.js';
import { ReplayControls } from './components/ReplayControls.js';
import { ExportPanel } from './components/ExportPanel.js';
import { BytecodePanel } from './components/BytecodePanel.js';
import { InputsPanel } from './components/InputsPanel.js';
import { RuntimePanel } from './components/RuntimePanel.js';
export function App(){
 const {state,dispatch,loadFile,save,replace,fileLoading,exportReport,analyze,cancel,run,stop}=useWorkspace();
 const result=canUseCurrentMarks(state)?state.currentAnalysis:null,artifacts=result?.artifacts;
 const highlight=artifacts?.lowered?.sourceMap[state.selectedNodeId??''];
 return <main>
  <header><div className="brand"><span className="brand-mark">F</span><div><h1>FlowGuard</h1><p>Follow the code. Understand the flow.</p></div></div><span className="phase">Phase 3 · Analyze and run</span></header>
  <section className="notice"><strong>Analyze, inspect, then run</strong><span>Analyze finds possible explicit flows and verifies bytecode. Run uses your supplied inputs. SQL and shell effects are simulated.</span></section>
  <p className="desktop-guidance">Use a desktop viewport for the full workspace. Your source can still be edited and saved here.</p>
  <nav aria-label="Workspace panels">{(['workspace','examples','help'] as const).map(panel=><button key={panel} aria-pressed={state.panel===panel} onClick={()=>dispatch({type:'SET_PANEL',panel})}>{panel[0]!.toUpperCase()+panel.slice(1)}</button>)}</nav>
  <div hidden={state.panel!=='workspace'}>
   <Toolbar fileLoading={fileLoading} filename={state.filename} dirty={state.dirty} revision={state.revision} onLoad={file=>{void loadFile(file);}} onSave={()=>save()} analyzeEnabled={canAnalyze(state,true)} runEnabled={canRun(state,true)} onAnalyze={()=>{void analyze();}} onRun={run}/>
   {state.activeAnalysisId&&<button onClick={cancel}>Cancel analysis</button>}
   {state.activeExecutionId&&<button onClick={stop}>Stop execution</button>}
   {(state.progress||result)&&<div role="status" aria-live="polite">{state.progress?`Stage: ${state.progress.stage}`:`Analysis: ${result!.status}`}</div>}
   <div className="workspace"><section className="editor-panel"><h2>Source</h2><SourceEditor diagnostics={result?.diagnostics??[]} highlight={highlight} source={state.source} onChange={source=>dispatch({type:'EDIT_SOURCE',source})}/><p className="muted">Exact source stays in memory. Save source to download it.</p></section>
    <section className="graph-panel">{artifacts?.lowered?<GraphPanel program={artifacts.lowered} positions={state.positions} status={state.graphLayoutStatus} selected={state.selectedNodeId} onSelect={id=>dispatch({type:'SELECT_NODE',id})} partial={result?.status!=='completed'}/>:<><h2>Control flow</h2><div className="empty"><span className="diagram-icon">◇</span><h3>No graph yet</h3><p>Load an example or write source, then select Analyze.</p></div></>}</section>
    <section className="inspector-panel">{artifacts?<InspectorPanel artifacts={artifacts} nodeId={state.selectedNodeId} replay={state.replayMode==='final'?null:state.replayIndex} trace={artifacts.replay} taint={artifacts.taint}/>:<><h2>Inspection</h2><div className="empty"><h3>No analysis results</h3><p>Analyze to inspect compiler artifacts and possible flows.</p></div></>}{artifacts?.findings&&artifacts.semantic&&<FindingsPanel findings={artifacts.findings} semantic={artifacts.semantic} explanations={artifacts.explanations??[]} selected={state.selectedFindingId} onSelect={finding=>dispatch({type:'SELECT_FINDING',id:finding.id})}/>}</section></div>
   {artifacts?.replay&&<ReplayControls trace={artifacts.replay} index={state.replayIndex} final={state.replayMode==='final'} playing={state.playing} onIndex={index=>dispatch({type:'SET_REPLAY_INDEX',index})} onFinal={()=>dispatch({type:'SET_REPLAY_FINAL'})} onPlay={playing=>{if(playing&&state.replayMode==='final')dispatch({type:'SET_REPLAY_INDEX',index:-1});dispatch({type:'SET_REPLAY_PLAYING',playing});}}/>}
   {state.currentAnalysis&&<ExportPanel analysis={state.currentAnalysis} current={hasCurrentAnalysis(state)} onExport={exportReport}/>}
   {artifacts?.bytecode&&artifacts.disassembly&&<BytecodePanel key={result!.requestId} artifact={artifacts.bytecode} lines={artifacts.disassembly} selected={state.selectedBytecodePc} onSelect={pc=>dispatch({type:'SELECT_BYTECODE',pc})}/>}
   <InputsPanel json={state.inputJson} error={state.inputValidation} onChange={json=>dispatch({type:'SET_INPUTS',json})}/>
   <RuntimePanel key={state.currentExecution?.requestId??'idle'} status={state.runtimeStatus} result={state.currentExecution} inputCount={state.inputValidation?0:(JSON.parse(state.inputJson) as string[]).length}/>
  </div>
  {state.panel==='examples'&&<ExamplesPanel onLoad={(source,filename)=>{replace(source,filename);dispatch({type:'SET_PANEL',panel:'workspace'});}}/>}
  {state.panel==='help'&&<HelpPanel/>}
  {state.pendingReplacement&&<ReplaceSourceDialog filename={state.pendingReplacement.filename} onSave={()=>save(true)} onDiscard={()=>dispatch({type:'CONFIRM_DISCARD_REPLACE'})} onCancel={()=>dispatch({type:'CANCEL_REPLACEMENT'})}/>}
  <StatusBar source={state.source} notice={fileLoading?'Reading source file…':state.adapterNotice}/>
 </main>;
}
