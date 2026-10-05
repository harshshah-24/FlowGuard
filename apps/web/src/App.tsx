import { canUseCurrentMarks } from './workspace/selectors.js';
import { useWorkspace } from './workspace/useWorkspace.js';
import { SourceEditor } from './components/SourceEditor.js';
import { Toolbar } from './components/Toolbar.js';
import { StatusBar } from './components/StatusBar.js';
import { ExamplesPanel } from './components/ExamplesPanel.js';
import { HelpPanel } from './components/HelpPanel.js';
import { ReplaceSourceDialog } from './components/ReplaceSourceDialog.js';
export function App(){
 const {state,dispatch,loadFile,save,replace,fileLoading}=useWorkspace();
 return <main>
  <header><div className="brand"><span className="brand-mark">F</span><div><h1>FlowGuard</h1><p>Follow the code. Understand the flow.</p></div></div><span className="phase">Phase 1 · Compiler front end</span></header>
  <section className="notice"><strong>Typed compiler foundation</strong><span>Lexer, parser, scope/type checks, and lowering are implemented in the core. Full analysis and execution arrive in later phases.</span></section>
  <p className="desktop-guidance">Use a desktop viewport for the full workspace. Your source can still be edited and saved here.</p>
  <nav aria-label="Workspace panels">{(['workspace','examples','help'] as const).map(panel=><button key={panel} aria-pressed={state.panel===panel} onClick={()=>dispatch({type:'SET_PANEL',panel})}>{panel[0]!.toUpperCase()+panel.slice(1)}</button>)}</nav>
  <div hidden={state.panel!=='workspace'}>
   <Toolbar fileLoading={fileLoading} filename={state.filename} dirty={state.dirty} revision={state.revision} onLoad={file=>{void loadFile(file);}} onSave={()=>save()}/>
   <div className="workspace"><section className="editor-panel"><h2>Source</h2><SourceEditor diagnostics={canUseCurrentMarks(state)?state.currentAnalysis!.diagnostics:[]} source={state.source} onChange={source=>dispatch({type:'EDIT_SOURCE',source})}/><p className="muted">Exact source stays in memory. Save source to download it.</p></section>
    <section className="graph-panel"><h2>Control flow</h2><div className="empty"><span className="diagram-icon">◇</span><h3>No graph yet</h3><p>Graph presentation connects after the analysis stages. The core lowering API produces typed instructions and branch edges.</p></div></section>
    <section className="inspector-panel"><h2>Inspection</h2><div className="empty"><h3>No analysis results</h3><p>Analyze stays disabled until the full engine is ready. No security verdict or bytecode is available yet.</p></div></section></div>
  </div>
  {state.panel==='examples'&&<ExamplesPanel onLoad={(source,filename)=>{replace(source,filename);dispatch({type:'SET_PANEL',panel:'workspace'});}}/>}
  {state.panel==='help'&&<HelpPanel/>}
  {state.pendingReplacement&&<ReplaceSourceDialog filename={state.pendingReplacement.filename} onSave={()=>save(true)} onDiscard={()=>dispatch({type:'CONFIRM_DISCARD_REPLACE'})} onCancel={()=>dispatch({type:'CANCEL_REPLACEMENT'})}/>}
  <StatusBar source={state.source} notice={fileLoading?'Reading source file…':state.adapterNotice}/>
 </main>;
}
