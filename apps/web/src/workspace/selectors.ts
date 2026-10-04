import type { WorkspaceState } from './types.js';
export function hasCurrentAnalysis(s:WorkspaceState):boolean { return s.currentAnalysis?.snapshot?.revision===s.revision && s.currentAnalysis.snapshot.source===s.source; }
export function canAnalyze(s:WorkspaceState,engineAvailable=false):boolean { return engineAvailable && s.source.trim().length>0 && s.activeAnalysisId===null && s.activeExecutionId===null; }
export function canRun(s:WorkspaceState,engineAvailable=false):boolean { return engineAvailable && hasCurrentAnalysis(s) && s.analysisStatus==='completed' && !!s.currentAnalysis?.artifacts.bytecode && s.inputValidation===null && s.activeAnalysisId===null && s.activeExecutionId===null; }
export function canUseCurrentMarks(s:WorkspaceState):boolean { return hasCurrentAnalysis(s) && s.currentAnalysis?.status===s.analysisStatus; }
