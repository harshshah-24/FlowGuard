import { buildLineIndex } from '@flowguard/core';
import type { Diagnostic, SourceSpan } from '@flowguard/core';
export interface EditorRange {startLineNumber:number;startColumn:number;endLineNumber:number;endColumn:number}
export interface EditorChange {range:EditorRange;text:string}
// Monaco strips a leading BOM and normalizes its internal line endings. Keep exact
// source independently, mapping edits by line/column instead of normalized offsets.
export function applyEditorChanges(source:string,changes:readonly EditorChange[]):string{
 const index=buildLineIndex(source),bom=source.startsWith('\uFEFF')?1:0;
 const offset=(line:number,column:number)=>index.lineStarts[line-1]!+column-1+(line===1?bom:0);
 const mapped=changes.map(c=>({start:offset(c.range.startLineNumber,c.range.startColumn),end:offset(c.range.endLineNumber,c.range.endColumn),text:c.text})).sort((a,b)=>b.start-a.start);
 let result=source;for(const change of mapped)result=result.slice(0,change.start)+change.text+result.slice(change.end);return result;
}
export function editorRange(span:SourceSpan,source:string):EditorRange{
 const bom=source.startsWith('\uFEFF')?1:0;
 return {startLineNumber:span.startLine,startColumn:Math.max(1,span.startColumn-(span.startLine===1?bom:0)),endLineNumber:span.endLine,endColumn:Math.max(1,span.endColumn-(span.endLine===1?bom:0))};
}
export function markerData(diagnostics:readonly Diagnostic[],source:string){return diagnostics.filter(d=>d.span).map(d=>({...editorRange(d.span!,source),message:d.message,code:d.code,severity:d.severity==='error'?8:d.severity==='warning'?4:2}));}
