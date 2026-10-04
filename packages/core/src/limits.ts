import { CancelledFailure, LimitFailure, makeDiagnostic, type DiagnosticCode } from './diagnostics.js';
import type { DiagnosticStage } from './model.js';
export const DEFAULT_LIMITS = Object.freeze({
  maxSourceBytes: 262_144, maxNesting: 128, maxTokens: 65_536,
  maxAstNodes: 20_000, maxSlots: 4_000, maxCfgNodes: 2_000,
  maxInputSources: 256, maxBytecodeInstructions: 50_000,
  maxSolverVisits: 200_000, maxVerifierVisits: 200_000,
  maxStateCells: 4_000_000, maxSourceMemberships: 2_000_000,
  analysisDeadlineMs: 10_000, maxReplayEvents: 10_000,
  replayCheckpointInterval: 100, maxReplayBytes: 8_388_608,
  maxProvenanceFacts: 20_000, maxExplanationFacts: 200,
  maxReportBytes: 16_777_216, maxInteractiveGraphNodes: 200,
  maxVmInstructions: 100_000, executionDeadlineMs: 1_000,
  maxVmStack: 1_024, maxStringBytes: 65_536,
  maxVmStorageBytes: 4_194_304, maxVmEvents: 1_000,
  maxVmOutputBytes: 1_048_576, maxInputItems: 1_000, maxInputBytes: 1_048_576,
});
export type EffectiveLimits = { readonly [K in keyof typeof DEFAULT_LIMITS]: number };
export type LimitKey = keyof EffectiveLimits;
export interface BudgetHooks { readonly nowMs: () => number; readonly checkpointAbort?: () => boolean }
export class BudgetGuard {
  readonly limits: EffectiveLimits = DEFAULT_LIMITS;
  private readonly start: number;
  private checks = 0;
  constructor(private readonly hooks: BudgetHooks, private readonly mode: 'analysis' | 'execution' = 'analysis') { this.start = hooks.nowMs(); }
  checkCount(key: LimitKey, count: number, code: DiagnosticCode, stage: DiagnosticStage): void {
    if (!Number.isSafeInteger(count) || count < 0) throw new RangeError('Budget counts must be nonnegative safe integers.');
    if (count > this.limits[key]) throw new LimitFailure(makeDiagnostic(code, stage, `${key} limit exceeded (${this.limits[key]}).`));
  }
  checkpoint(stage: DiagnosticStage, force = false): void {
    this.checks++;
    if (!force && this.checks % 256 !== 0) return;
    if (this.hooks.checkpointAbort?.()) throw new CancelledFailure(makeDiagnostic('CANCELLED', stage, 'Operation cancelled.'));
    const deadline = this.mode === 'analysis' ? this.limits.analysisDeadlineMs : this.limits.executionDeadlineMs;
    if (this.hooks.nowMs() - this.start >= deadline) throw new LimitFailure(makeDiagnostic(this.mode === 'analysis' ? 'LIMIT_COMPILE_TIME' : 'LIMIT_VM_TIME', stage, 'Operation deadline exceeded.'));
  }
  get elapsedMs(): number { return Math.max(0, this.hooks.nowMs() - this.start); }
}
