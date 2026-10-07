import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { initialWorkspace, workspaceReducer } from './reducer.js';
import { readSourceFile } from '../adapters/files.js';
import { downloadSource, downloadReport } from '../adapters/downloads.js';
import { currentSnapshot } from '../adapters/snapshot.js';
import { AnalysisClient } from '../adapters/workerClient.js';
import { LayoutClient } from '../adapters/layoutClient.js';
import { ExecutionClient } from '../adapters/executionClient.js';
import { canRun, canUseCurrentMarks } from './selectors.js';
export function useWorkspace(){
 const [state,dispatch]=useReducer(workspaceReducer,initialWorkspace),current=useRef(state),loadId=useRef(0);current.current=state;
 const [fileLoading,setFileLoading]=useState(false);
 const hashing=useRef(0),mounted=useRef(true);
 const analysisClient=useMemo(()=>new AnalysisClient(progress=>dispatch({type:'ANALYSIS_PROGRESS',progress}),result=>dispatch({type:'ANALYSIS_TERMINAL',result})),[]);
 const executionClient=useMemo(()=>new ExecutionClient(result=>dispatch({type:'EXECUTION_TERMINAL',result})),[]);
 const layoutClient=useMemo(()=>new LayoutClient((snapshotId,positions)=>dispatch({type:'LAYOUT_RESULT',snapshotId,positions}),(snapshotId,message)=>dispatch({type:'LAYOUT_ERROR',snapshotId,message})),[]);
 const notice=(error:unknown)=>dispatch({type:'EXPORT_ERROR',message:error instanceof Error?error.message:'Operation failed. Please try again.'});
 const loadFile=async(file:File)=>{
  const id=++loadId.current,revision=current.current.revision;setFileLoading(true);
  try{const replacement=await readSourceFile(file);if(id!==loadId.current)return;if(current.current.revision!==revision){dispatch({type:'EXPORT_ERROR',message:'Draft changed while reading. Select the file again to load it.'});return;}dispatch({type:'REQUEST_REPLACEMENT',...replacement});}catch(error){if(id===loadId.current)notice(error);}finally{if(id===loadId.current)setFileLoading(false);}
 };
 const save=(replace=false)=>{const captured=current.current;try{downloadSource(captured.source,captured.filename);if(replace)dispatch({type:'CONFIRM_SAVE_REPLACE'});else dispatch({type:'SOURCE_SAVED',revision:captured.revision});dispatch({type:'EXPORT_SUCCESS'});}catch(error){notice(error);}};
 const replace=(source:string,filename:string)=>{++loadId.current;setFileLoading(false);dispatch({type:'REQUEST_REPLACEMENT',source,filename});};
 const analyze=async()=>{const captured=current.current;if(!captured.source.trim()||captured.activeAnalysisId||captured.activeExecutionId)return;const generation=++hashing.current;
  try{const snapshot=await currentSnapshot(captured.source,captured.filename,captured.revision,()=>current.current.revision);if(!snapshot||!mounted.current||generation!==hashing.current||current.current.activeAnalysisId||current.current.activeExecutionId)return;const requestId=analysisClient.nextId();dispatch({type:'START_ANALYSIS',requestId,revision:snapshot.revision});analysisClient.start({type:'analyze',protocolVersion:1,requestId,snapshot,options:{recordReplay:true}});}catch(error){notice(error);}
 };
 const cancel=()=>{++hashing.current;dispatch({type:'CANCEL_ANALYSIS'});analysisClient.cancel(false);};
 const run=()=>{const captured=current.current;if(!canRun(captured,true))return;const requestId=executionClient.nextId(),analysis=captured.currentAnalysis!;dispatch({type:'START_EXECUTION',requestId,revision:captured.revision});executionClient.start({type:'execute',protocolVersion:1,requestId,snapshotId:analysis.snapshot!.snapshotId,revision:captured.revision,bytecode:analysis.artifacts.bytecode!,inputs:JSON.parse(captured.inputJson) as string[]});};
 const stop=()=>executionClient.cancel(true);
 const exportReport=(format:'json'|'markdown')=>{const captured=current.current;if(!captured.currentAnalysis)return;try{downloadReport(captured.currentAnalysis,format,captured.currentExecution??undefined);dispatch({type:'EXPORT_SUCCESS'});}catch(error){notice(error);}};
 useEffect(()=>{analysisClient.cancel(false);executionClient.cancel(false);layoutClient.cancel();++hashing.current;},[state.revision,analysisClient,executionClient,layoutClient]);
 useEffect(()=>{executionClient.cancel(false);},[state.inputJson,executionClient]);
 useEffect(()=>{if(canUseCurrentMarks(state)&&state.currentAnalysis?.artifacts.lowered&&state.currentAnalysis.snapshot&&state.graphLayoutStatus==='running')layoutClient.start(state.currentAnalysis.snapshot.snapshotId,state.currentAnalysis.artifacts.lowered);return ()=>layoutClient.cancel();},[state.currentAnalysis,state.graphLayoutStatus,state.revision,layoutClient]);
 useEffect(()=>{if(!state.playing)return;const trace=state.currentAnalysis?.artifacts.replay;if(!trace)return;let frame=0,start=performance.now();const tick=(now:number)=>{if(now-start>=400){const next=state.replayIndex+1;if(next>=trace.events.length){dispatch({type:'SET_REPLAY_PLAYING',playing:false});return;}dispatch({type:'SET_REPLAY_INDEX',index:next});dispatch({type:'SET_REPLAY_PLAYING',playing:next<trace.events.length-1});start=now;}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);return ()=>cancelAnimationFrame(frame);},[state.playing,state.replayIndex,state.revision,state.currentAnalysis]);
 useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;++hashing.current;++loadId.current;analysisClient.cancel(false);executionClient.cancel(false);layoutClient.cancel();};},[analysisClient,executionClient,layoutClient]);
 useEffect(()=>{const handler=(event:BeforeUnloadEvent)=>{if(current.current.dirty){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',handler);return ()=>window.removeEventListener('beforeunload',handler);},[]);
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='Escape'){if(current.current.pendingReplacement)dispatch({type:'CANCEL_REPLACEMENT'});else dispatch({type:'SET_PANEL',panel:'workspace'});}if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();void analyze();}};window.addEventListener('keydown',handler);return ()=>window.removeEventListener('keydown',handler);},[]);
 return {state,dispatch,loadFile,save,replace,fileLoading,analyze,cancel,run,stop,exportReport};
}
