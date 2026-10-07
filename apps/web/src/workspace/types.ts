import type { AnalysisProgress, AnalysisResult, ExecutionResult } from '@flowguard/core';
export type AnalysisStatus = 'empty'|'draft'|'running'|'completed'|'partial'|'invalid-source'|'invalid-request'|'cancelled'|'incomplete-limit'|'internal-error'|'stale';
export interface WorkspaceState {
  source:string;filename:string;revision:number;dirty:boolean;panel:'workspace'|'examples'|'help';
  analysisStatus:AnalysisStatus;activeAnalysisId:string|null;currentAnalysis:AnalysisResult|null;
  progress:AnalysisProgress|null;selectedFindingId:string|null;selectedNodeId:string|null;
  selectedBytecodePc:number|null;replayIndex:number;replayMode:'final'|'updates';playing:boolean;
  inputJson:string;inputValidation:string|null;runtimeStatus:'idle'|'running'|'completed'|'runtime-error'|'cancelled'|'incomplete-limit'|'internal-error';
  activeExecutionId:string|null;currentExecution:ExecutionResult|null;
  graphLayoutStatus:'idle'|'running'|'ready'|'error';positions:Record<string,{x:number;y:number}>;
  adapterNotice:string|null;pendingReplacement:{source:string;filename:string}|null;
}
export type WorkspaceAction =
 | {type:'EDIT_SOURCE';source:string}
 | {type:'SOURCE_SAVED';revision:number}
 | {type:'REQUEST_REPLACEMENT';source:string;filename:string}
 | {type:'CONFIRM_SAVE_REPLACE'|'CONFIRM_DISCARD_REPLACE'|'CANCEL_REPLACEMENT'}
 | {type:'START_ANALYSIS';requestId:string;revision:number}
 | {type:'ANALYSIS_PROGRESS';progress:AnalysisProgress}
 | {type:'ANALYSIS_TERMINAL';result:AnalysisResult}
 | {type:'CANCEL_ANALYSIS'}
 | {type:'SELECT_FINDING';id:string|null}
 | {type:'SELECT_NODE';id:string|null}
 | {type:'SELECT_BYTECODE';pc:number|null}
 | {type:'SET_REPLAY_INDEX';index:number}
 | {type:'SET_REPLAY_FINAL'}
 | {type:'SET_REPLAY_PLAYING';playing:boolean}
 | {type:'SET_INPUTS';json:string}
 | {type:'START_EXECUTION';requestId:string;revision:number}
 | {type:'EXECUTION_TERMINAL';result:ExecutionResult}
 | {type:'CANCEL_EXECUTION'}
 | {type:'LAYOUT_RESULT';snapshotId:string;positions:WorkspaceState['positions']}
 | {type:'LAYOUT_ERROR';snapshotId:string;message:string}
 | {type:'EXPORT_SUCCESS'}|{type:'EXPORT_ERROR';message:string}
 | {type:'SET_PANEL';panel:WorkspaceState['panel']};
