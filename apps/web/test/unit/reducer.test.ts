import {describe,it,expect} from 'vitest';
import {workspaceReducer,initialWorkspace} from '../../src/workspace/reducer.js';
import {canAnalyze,canRun,canUseCurrentMarks} from '../../src/workspace/selectors.js';
import {emptyAnalysis} from '../../../../packages/core/test/fixtures.js';
describe('workspace source lifecycle',()=>{
 it('increments revision and invalidates active work on edit',()=>{
  let s=workspaceReducer(initialWorkspace,{type:'EDIT_SOURCE',source:'print(1);'});
  expect(s.dirty).toBe(true);expect(s.revision).toBe(1);expect(s.analysisStatus).toBe('draft');
  s=workspaceReducer(s,{type:'START_ANALYSIS',requestId:'request-1',revision:1});
  expect(s.activeAnalysisId).toBe('request-1');
  s=workspaceReducer(s,{type:'EDIT_SOURCE',source:'print(2);'});
  expect(s.activeAnalysisId).toBe(null);expect(s.revision).toBe(2);
  const late={...emptyAnalysis('print(1);',1),requestId:'request-1'};
  expect(workspaceReducer(s,{type:'ANALYSIS_TERMINAL',result:late})).toBe(s);
 });
 it('marks prior snapshots stale and disables Run/marks',()=>{
  const analysis=emptyAnalysis();const s={...initialWorkspace,currentAnalysis:analysis,analysisStatus:'completed' as const};
  const changed=workspaceReducer(s,{type:'EDIT_SOURCE',source:'print(1);'});
  expect(changed.analysisStatus).toBe('stale');expect(changed.currentAnalysis).toBe(analysis);
  expect(canRun(changed,true)).toBe(false);expect(canUseCurrentMarks(changed)).toBe(false);
 });
 it('does not attach previous-result marks to a cancelled rerun',()=>{
  const s={...initialWorkspace,currentAnalysis:emptyAnalysis(),analysisStatus:'cancelled' as const};
  expect(canUseCurrentMarks(s)).toBe(false);
 });
 it('protects dirty source through replacement/cancel/discard',()=>{
  let s=workspaceReducer(initialWorkspace,{type:'EDIT_SOURCE',source:'unsaved'});
  s=workspaceReducer(s,{type:'REQUEST_REPLACEMENT',source:'new',filename:'new.fg'});
  expect(s.source).toBe('unsaved');
  expect(workspaceReducer(s,{type:'CANCEL_REPLACEMENT'}).source).toBe('unsaved');
  s=workspaceReducer(s,{type:'CONFIRM_DISCARD_REPLACE'});
  expect(s.source).toBe('new');expect(s.filename).toBe('new.fg');expect(s.dirty).toBe(true);
 });
 it('keeps navigation from destroying a draft; phase-0 actions stay unavailable',()=>{
  const s=workspaceReducer(initialWorkspace,{type:'EDIT_SOURCE',source:'print(1);'});
  expect(workspaceReducer(s,{type:'SET_PANEL',panel:'help'}).source).toBe(s.source);
  expect(canAnalyze(s)).toBe(false);expect(canRun(s)).toBe(false);
 });
 it('rejects stale/duplicate completions and input syntax errors',()=>{
  let s=workspaceReducer(initialWorkspace,{type:'EDIT_SOURCE',source:'print(1);'});
  s=workspaceReducer(s,{type:'START_ANALYSIS',requestId:'active',revision:1});
  expect(workspaceReducer(s,{type:'ANALYSIS_TERMINAL',result:emptyAnalysis()})).toBe(s);
  s=workspaceReducer(s,{type:'CANCEL_ANALYSIS'});expect(s.analysisStatus).toBe('cancelled');
  expect(workspaceReducer(s,{type:'ANALYSIS_TERMINAL',result:{...emptyAnalysis('print(1);',1),requestId:'active'}})).toBe(s);
  expect(workspaceReducer(s,{type:'SET_INPUTS',json:'[1]'}).inputValidation).not.toBeNull();
 });
});
