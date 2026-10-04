import type { SourceSpan } from './model.js';
import { DEFAULT_LIMITS } from './limits.js';
import { makeDiagnostic, SourceFailure, LimitFailure } from './diagnostics.js';
// Encoding globals are common to Node and browsers, without DOM/Node type libraries.
declare const TextEncoder: { new(): { encode(text: string): Uint8Array } };
declare const TextDecoder: { new(label: string, options: { fatal: boolean; ignoreBOM: boolean }): { decode(bytes: Uint8Array): string } };
export function utf8ByteLength(text: string): number { return new TextEncoder().encode(text).byteLength; }
export function decodeUtf8(bytes: Uint8Array): string {
  if (bytes.byteLength > DEFAULT_LIMITS.maxSourceBytes) throw new LimitFailure(makeDiagnostic('FILE_TOO_LARGE', 'adapter', 'Source file exceeds the byte limit.'));
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { throw new SourceFailure(makeDiagnostic('FILE_ENCODING', 'adapter', 'Source must be valid UTF-8.')); }
}
export interface LineIndex { readonly sourceLength: number; readonly lineStarts: readonly number[] }
export function buildLineIndex(source: string): LineIndex {
  const starts = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\r') { if (source[i + 1] === '\n') i++; starts.push(i + 1); }
    else if (source[i] === '\n') starts.push(i + 1);
  }
  return { sourceLength: source.length, lineStarts: starts };
}
function position(index: LineIndex, offset: number): { line: number; column: number } {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > index.sourceLength) throw new RangeError('Source offset is out of bounds.');
  let low = 0, high = index.lineStarts.length;
  while (low + 1 < high) { const middle = Math.floor((low + high) / 2); if (index.lineStarts[middle]! <= offset) low = middle; else high = middle; }
  return { line: low + 1, column: offset - index.lineStarts[low]! + 1 };
}
export function makeSpan(index: LineIndex, start: number, end: number): SourceSpan {
  if (end < start) throw new RangeError('Span end precedes start.');
  const a = position(index, start), b = position(index, end);
  return { start, end, startLine: a.line, startColumn: a.column, endLine: b.line, endColumn: b.column };
}
export function isValidSpan(index: LineIndex, span: SourceSpan): boolean {
  try { const expected = makeSpan(index, span.start, span.end); return (Object.keys(expected) as (keyof SourceSpan)[]).every(key => span[key] === expected[key]); }
  catch { return false; }
}
