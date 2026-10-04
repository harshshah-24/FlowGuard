import { describe,it,expect } from 'vitest';
import { buildLineIndex,makeSpan,isValidSpan,decodeUtf8,utf8ByteLength,DEFAULT_LIMITS,SourceFailure,LimitFailure } from '../src/index.js';
describe('original-source positions',()=>{
 it('counts CRLF as one break but two offsets',()=>{
  const index=buildLineIndex('a\r\nb\rc\nd');
  expect(index.lineStarts).toEqual([0,3,5,7]);
  expect(makeSpan(index,3,4)).toEqual({start:3,end:4,startLine:2,startColumn:1,endLine:2,endColumn:2});
  expect(makeSpan(index,8,8)).toEqual({start:8,end:8,startLine:4,startColumn:2,endLine:4,endColumn:2});
 });
 it('preserves BOM and UTF-16 columns while byte sizes are UTF-8',()=>{
  const original='\ufeff😀x\r\n';const source=decodeUtf8(new TextEncoder().encode(original));
  expect(source).toBe(original);expect(utf8ByteLength(source)).toBe(10);
  const index=buildLineIndex(source);
  expect(makeSpan(index,1,3)).toEqual({start:1,end:3,startLine:1,startColumn:2,endLine:1,endColumn:4});
  expect(makeSpan(index,6,6).startLine).toBe(2);
 });
 it('handles empty source and rejects invalid diagnostic positions',()=>{
  const index=buildLineIndex('');const eof=makeSpan(index,0,0);
  expect(eof.startColumn).toBe(1);expect(isValidSpan(index,eof)).toBe(true);
  expect(isValidSpan(index,{...eof,startColumn:2})).toBe(false);
  expect(()=>makeSpan(index,-1,0)).toThrow(RangeError);
  expect(()=>makeSpan(buildLineIndex('abc'),2,1)).toThrow(RangeError);
 });
 it('rejects malformed UTF-8 rather than replacing it',()=>{expect(()=>decodeUtf8(Uint8Array.of(0xc3,0x28))).toThrow(SourceFailure);});
 it('accepts the byte cap and rejects cap+1',()=>{
  expect(decodeUtf8(new Uint8Array(DEFAULT_LIMITS.maxSourceBytes).fill(97)).length).toBe(DEFAULT_LIMITS.maxSourceBytes);
  expect(()=>decodeUtf8(new Uint8Array(DEFAULT_LIMITS.maxSourceBytes+1))).toThrow(LimitFailure);
 });
});
