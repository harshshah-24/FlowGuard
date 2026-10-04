import { useReducer } from 'react';
import { workspaceReducer, initialWorkspace } from './workspace/reducer.js';
export function App() {
 const [state,dispatch]=useReducer(workspaceReducer,initialWorkspace);
 return <main>
  <header><div className="brand"><span className="brand-mark">F</span><div><h1>FlowGuard</h1><p>Follow the code. Understand the flow.</p></div></div><span className="phase">Phase 0 · Foundation</span></header>
  <section className="notice"><strong>Compiler foundation</strong><span>The workspace is ready for development. Analysis, graph generation, and execution arrive in later phases.</span></section>
  <nav aria-label="Workspace panels">{(['workspace','examples','help'] as const).map(panel=><button key={panel} aria-pressed={state.panel===panel} onClick={()=>dispatch({type:'SET_PANEL',panel})}>{panel[0]!.toUpperCase()+panel.slice(1)}</button>)}</nav>
  {state.panel==='workspace'?<>
   <div className="toolbar"><span><strong>{state.filename}</strong> <span className="muted">{state.dirty?'Unsaved draft':'Empty program'} · Revision {state.revision}</span></span><div><button disabled title="Analysis is not implemented in Phase 0">Analyze</button><button disabled title="Bytecode and VM are not implemented in Phase 0">Run</button></div></div>
   <div className="workspace"><section className="editor-panel"><h2>Source</h2><label htmlFor="source">Write a FlowGuard program</label><textarea id="source" spellCheck={false} placeholder={'let name: string = input("Name");\nprint(name);'} value={state.source} onChange={event=>dispatch({type:'EDIT_SOURCE',source:event.target.value})}/><p className="muted">Editable draft only. This text is not analyzed, executed, or saved.</p></section>
    <section className="graph-panel"><h2>Control flow</h2><div className="empty"><span className="diagram-icon">◇</span><h3>No graph yet</h3><p>The compiler will turn source into a graph in the next phases.</p></div></section>
    <section className="inspector-panel"><h2>Inspection</h2><div className="empty"><h3>No analysis results</h3><p>Tokens, syntax tree, symbols, findings, and bytecode will appear after the engine is implemented.</p></div></section></div>
  </>:state.panel==='examples'?<section className="page-panel"><h2>Examples</h2><p>Synthetic examples are defined in the repository. Loading them into the editor will be connected in Phase 1.</p><p>Unsafe queries, parameter binding, loops, and short-circuit expressions will demonstrate the compiler.</p></section>:<section className="page-panel"><h2>About this foundation</h2><p>FlowGuard is a compiler-design project with static taint analysis and a bounded bytecode virtual machine.</p><p>Phase 0 establishes contracts, source locations, budgets, tests, and the workspace shell. It does not provide a working analyzer or VM yet.</p><p>Your draft lives in memory. Reloading the page loses it.</p></section>}
  <footer role="status">{state.analysisStatus==='empty'?'Start with a source draft.':state.analysisStatus==='draft'?'Draft updated. Analysis is not available yet.':'Foundation workspace.'} <span>No backend · No accounts · No autosave</span></footer>
 </main>;
}
