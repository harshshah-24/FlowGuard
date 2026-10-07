import { InputsSchema, boundary } from '@flowguard/core';
import type { WorkspaceAction, WorkspaceState } from './types.js';
import { canRun, hasCurrentAnalysis, canUseCurrentMarks } from './selectors.js';
export const initialWorkspace:WorkspaceState = {
 source:'',filename:'program.fg',revision:0,dirty:false,panel:'workspace',analysisStatus:'empty',activeAnalysisId:null,currentAnalysis:null,
 progress:null,selectedFindingId:null,selectedNodeId:null,selectedBytecodePc:null,replayIndex:-1,replayMode:'final',playing:false,
 inputJson:'[]',inputValidation:null,runtimeStatus:'idle',activeExecutionId:null,currentExecution:null,graphLayoutStatus:'idle',positions:{},adapterNotice:null,pendingReplacement:null,
};
function changed(s:WorkspaceState,source:string,filename=s.filename):WorkspaceState {
 return {...s,source,filename,revision:s.revision+1,dirty:true,analysisStatus:s.currentAnalysis?'stale':source.trim()?'draft':'empty',
 activeAnalysisId:null,activeExecutionId:null,progress:null,selectedFindingId:null,selectedNodeId:null,selectedBytecodePc:null,playing:false,replayIndex:-1,replayMode:'final',
 runtimeStatus:'idle',currentExecution:null,graphLayoutStatus:'idle',positions:{},adapterNotice:null,pendingReplacement:null};
}
function validInputs(json:string):string|null {
 try {return boundary(InputsSchema).safeParse(JSON.parse(json)).success?null:'Inputs must be a bounded JSON array of strings.';}
 catch {return 'Inputs must be valid JSON.';}
}
export function workspaceReducer(s:WorkspaceState,a:WorkspaceAction):WorkspaceState {
 switch(a.type) {
  case 'SOURCE_SAVED':return a.revision===s.revision?{...s,dirty:false}:s;
  case 'EDIT_SOURCE':return a.source===s.source?s:changed(s,a.source);
  case 'REQUEST_REPLACEMENT':return s.dirty?{...s,pendingReplacement:{source:a.source,filename:a.filename}}:changed(s,a.source,a.filename);
  case 'CANCEL_REPLACEMENT':return {...s,pendingReplacement:null};
  case 'CONFIRM_SAVE_REPLACE':case 'CONFIRM_DISCARD_REPLACE':return s.pendingReplacement?changed(s,s.pendingReplacement.source,s.pendingReplacement.filename):s;
  case 'START_ANALYSIS':return a.revision!==s.revision||s.activeAnalysisId||s.activeExecutionId||!s.source.trim()?s:{...s,analysisStatus:'running',activeAnalysisId:a.requestId,progress:null,playing:false,adapterNotice:null};
  case 'ANALYSIS_PROGRESS':return a.progress.requestId===s.activeAnalysisId&&a.progress.revision===s.revision?{...s,progress:a.progress}:s;
  case 'ANALYSIS_TERMINAL': {
   const r=a.result;
   if(r.requestId!==s.activeAnalysisId || (r.snapshot && (r.snapshot.revision!==s.revision||r.snapshot.source!==s.source)))return s;
   return {...s,analysisStatus:r.status,activeAnalysisId:null,currentAnalysis:r,progress:null,selectedFindingId:null,selectedNodeId:null,selectedBytecodePc:null,
    replayIndex:(r.artifacts.replay?.events.length??0)-1,replayMode:'final',playing:false,runtimeStatus:'idle',currentExecution:null,graphLayoutStatus:r.artifacts.lowered?'running':'idle',positions:{}};
  }
  case 'CANCEL_ANALYSIS':return s.activeAnalysisId?{...s,activeAnalysisId:null,analysisStatus:'cancelled',progress:null,playing:false}:s;
  case 'SELECT_FINDING':{const finding=s.currentAnalysis?.artifacts.findings?.find(f=>f.id===a.id);return canUseCurrentMarks(s)&&s.analysisStatus==='completed'&&(a.id===null||finding)?{...s,selectedFindingId:a.id,selectedNodeId:finding?.sinkNodeId??null}:s;}
  case 'SELECT_NODE':return canUseCurrentMarks(s)&&(a.id===null||s.currentAnalysis?.artifacts.lowered?.instructions.some(n=>n.id===a.id))?{...s,selectedNodeId:a.id}:s;
  case 'SELECT_BYTECODE':{const mapping=a.pc===null?null:s.currentAnalysis?.artifacts.bytecode?.sourceMap[a.pc];return canUseCurrentMarks(s)&&s.analysisStatus==='completed'&&(a.pc===null||mapping)?{...s,selectedBytecodePc:a.pc,selectedNodeId:mapping?.irNodeId??null}:s;}
  case 'SET_REPLAY_INDEX':return canUseCurrentMarks(s)&&s.currentAnalysis?.artifacts.replay&&Number.isInteger(a.index)&&a.index>=-1&&a.index<s.currentAnalysis.artifacts.replay.events.length?{...s,replayIndex:a.index,replayMode:'updates',playing:false}:s;
  case 'SET_REPLAY_FINAL':return canUseCurrentMarks(s)?{...s,replayMode:'final',playing:false}:s;
  case 'SET_REPLAY_PLAYING':return canUseCurrentMarks(s)&&s.currentAnalysis?.artifacts.replay?{...s,playing:a.playing}:s;
  case 'SET_INPUTS':return {...s,inputJson:a.json,inputValidation:validInputs(a.json),activeExecutionId:null,runtimeStatus:'idle',currentExecution:null};
  case 'START_EXECUTION':return a.revision===s.revision&&canRun(s,true)?{...s,activeExecutionId:a.requestId,runtimeStatus:'running',currentExecution:null}:s;
  case 'EXECUTION_TERMINAL':return a.result.requestId===s.activeExecutionId&&a.result.revision===s.revision&&a.result.snapshotId===s.currentAnalysis?.snapshot?.snapshotId?{...s,activeExecutionId:null,runtimeStatus:a.result.status,currentExecution:a.result}:s;
  case 'CANCEL_EXECUTION':return s.activeExecutionId?{...s,activeExecutionId:null,runtimeStatus:'cancelled'}:s;
  case 'LAYOUT_RESULT':return hasCurrentAnalysis(s)&&canUseCurrentMarks(s)&&a.snapshotId===s.currentAnalysis?.snapshot?.snapshotId?{...s,graphLayoutStatus:'ready',positions:a.positions}:s;
  case 'LAYOUT_ERROR':return hasCurrentAnalysis(s)&&canUseCurrentMarks(s)&&a.snapshotId===s.currentAnalysis?.snapshot?.snapshotId?{...s,graphLayoutStatus:'error',adapterNotice:a.message}:s;
  case 'EXPORT_SUCCESS':return {...s,adapterNotice:'Download initiated.'};
  case 'EXPORT_ERROR':return {...s,adapterNotice:a.message};
  case 'SET_PANEL':return {...s,panel:a.panel};
 }
}
