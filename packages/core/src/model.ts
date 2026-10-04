import type { z } from 'zod';
import type * as C from './contracts.js';
export type SourceSpan = z.infer<typeof C.SourceSpanSchema>;
export type SourceSnapshot = z.infer<typeof C.SourceSnapshotSchema>;
export type Scalar = z.infer<typeof C.ScalarSchema>;
export type ScalarType = Scalar['type'];
export type Diagnostic = z.infer<typeof C.DiagnosticSchema>;
export type DiagnosticStage = Diagnostic['stage'];
export type Token = z.infer<typeof C.TokenSchema>;
export interface AstBase { id: string; span: SourceSpan }
export type Expression = AstBase & (
  | { kind: 'Literal'; scalar: Scalar }
  | { kind: 'Variable'; name: string }
  | { kind: 'Unary'; op: '!' | '-'; operand: Expression }
  | { kind: 'Binary'; op: '+' | '-' | '*' | '/' | '%' | '<' | '<=' | '>' | '>=' | '==' | '!=' | '&&' | '||'; left: Expression; right: Expression }
  | { kind: 'InputCall'; prompt: Expression }
);
export type Statement = AstBase & (
  | { kind: 'Block'; statements: Statement[] }
  | { kind: 'Declaration'; name: string; nameSpan: SourceSpan; type: ScalarType; initializer: Expression }
  | { kind: 'Assignment'; target: string; targetSpan: SourceSpan; value: Expression }
  | { kind: 'If'; condition: Expression; then: Block; optionalElse?: Block | undefined }
  | { kind: 'While'; condition: Expression; body: Block }
  | { kind: 'EffectCall'; name: 'print' | 'sql_query' | 'sql_bind' | 'shell'; args: Expression[] }
);
export type Block = Extract<Statement, { kind: 'Block' }>;
export type Program = AstBase & { kind: 'Program'; statements: Statement[] };
export type AstNode = Program | Statement | Expression;
export type SemanticModel = z.infer<typeof C.SemanticModelSchema>;
export type TypedSlot = z.infer<typeof C.TypedSlotSchema>;
export type LoweredInstruction = z.infer<typeof C.LoweredInstructionSchema>;
export type LoweredProgram = z.infer<typeof C.LoweredProgramSchema>;
export type SerializedState = z.infer<typeof C.SerializedStateSchema>;
export type TaintResult = z.infer<typeof C.TaintResultSchema>;
export type Finding = z.infer<typeof C.FindingSchema>;
export type ExplanationFact = z.infer<typeof C.ExplanationFactSchema>;
export type ReplayTrace = z.infer<typeof C.ReplayTraceSchema>;
export type BytecodeArtifact = z.infer<typeof C.BytecodeArtifactSchema>;
export type AnalyzeRequest = z.infer<typeof C.AnalyzeRequestSchema>;
export type AnalysisProgress = z.infer<typeof C.AnalysisProgressSchema>;
export type AnalysisResult = z.infer<typeof C.AnalysisResultSchema>;
export type ExecutionRequest = z.infer<typeof C.ExecutionRequestSchema>;
export type ExecutionEvent = z.infer<typeof C.ExecutionEventSchema>;
export type ExecutionResult = z.infer<typeof C.ExecutionResultSchema>;
export type Report = z.infer<typeof C.ReportSchema>;
export type ExampleProgram = z.infer<typeof C.ExampleProgramSchema>;

export type Symbol = z.infer<typeof C.SymbolSchema>;
export type Scope = z.infer<typeof C.ScopeSchema>;
export type InputSource = z.infer<typeof C.InputSourceSchema>;
export type CFGEdge = z.infer<typeof C.CFGEdgeSchema>;
export type ReplayEvent = z.infer<typeof C.ReplayEventSchema>;
export type BytecodeInstruction = z.infer<typeof C.BytecodeInstructionSchema>;
