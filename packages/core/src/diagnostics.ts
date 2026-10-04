import type { Diagnostic, DiagnosticStage, SourceSpan } from './model.js';
export const DIAGNOSTIC_CODES = [
  'REQUEST_INVALID', 'SCHEMA_UNSUPPORTED', 'INPUTS_INVALID',
  'LEX_INVALID_CHAR', 'LEX_UNTERMINATED_STRING', 'LEX_UNTERMINATED_COMMENT',
  'LEX_INVALID_ESCAPE', 'LEX_INTEGER_RANGE', 'PARSE_EXPECTED',
  'SEM_UNDECLARED', 'SEM_DUPLICATE', 'SEM_SHADOWING', 'SEM_TYPE',
  'SEM_ARGUMENTS', 'SEM_TEMPLATE_PLACEHOLDERS', 'TOO_MANY_DIAGNOSTICS',
  'TEMPLATE_UNVERIFIED', 'LIMIT_SOURCE', 'LIMIT_NESTING', 'LIMIT_TOKENS',
  'LIMIT_AST', 'LIMIT_SLOTS', 'LIMIT_CFG', 'LIMIT_SOURCES', 'LIMIT_SOLVER',
  'LIMIT_ANALYSIS_STORAGE', 'LIMIT_COMPILE_TIME', 'LIMIT_BYTECODE',
  'BYTECODE_INVALID', 'ENGINE_INTERNAL', 'WORKER_FAILED',
  'RUNTIME_INPUT_EXHAUSTED', 'RUNTIME_DIV_ZERO', 'RUNTIME_INT_OVERFLOW',
  'LIMIT_VM_TIME', 'LIMIT_VM_INSTRUCTIONS', 'LIMIT_VM_STACK',
  'LIMIT_VM_STRING', 'LIMIT_VM_STORAGE', 'LIMIT_VM_EVENTS', 'LIMIT_VM_OUTPUT',
  'CANCELLED', 'FILE_ENCODING', 'FILE_TOO_LARGE', 'FILE_READ',
  'OUTPUT_EXISTS', 'OUTPUT_WRITE', 'REPORT_TOO_LARGE', 'LAYOUT_FAILED',
] as const;
export type DiagnosticCode = (typeof DIAGNOSTIC_CODES)[number];
export function makeDiagnostic(code: DiagnosticCode, stage: DiagnosticStage, message: string, span?: SourceSpan): Diagnostic {
  const notice = code === 'TEMPLATE_UNVERIFIED';
  return { code, stage, message, severity: notice ? 'notice' : 'error', blocking: !notice, ...(span === undefined ? {} : { span }) };
}
export class DiagnosticFailure extends Error {
  constructor(readonly diagnostic: Diagnostic) { super(diagnostic.message); this.name = new.target.name; }
}
export class SourceFailure extends DiagnosticFailure {}
export class LimitFailure extends DiagnosticFailure {}
export class CancelledFailure extends DiagnosticFailure {}
