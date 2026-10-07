import { DEFAULT_LIMITS } from './limits.js';
import { DiagnosticFailure, makeDiagnostic } from './diagnostics.js';
import { utf8ByteLength } from './source.js';

// Iterative traversal also supports the deep, flat ASTs accepted by the parser.
// Strings are escaped in small chunks; no oversized serialized copy is made.
export function writeJson(value:unknown, emit:(chunk:string)=>void, pretty=false):void {
 type Task={value:unknown;depth:number}|{text:string};
 const stack:Task[]=[{value,depth:0}],indent=(n:number)=>pretty?'  '.repeat(n):'';
 const string=(s:string)=>{
  emit('"');let start=0;
  while(start<s.length){let end=Math.min(start+4096,s.length);const last=s.charCodeAt(end-1),next=s.charCodeAt(end);if(last>=0xd800&&last<=0xdbff&&next>=0xdc00&&next<=0xdfff)end--;
   emit(JSON.stringify(s.slice(start,end)).slice(1,-1));start=end;
  }emit('"');
 };
 while(stack.length){const task=stack.pop()!;if('text' in task){emit(task.text);continue;}
  const {value:v,depth}=task;
  if(typeof v==='string'){string(v);continue;}
  if(v===null||typeof v==='number'||typeof v==='boolean'){emit(JSON.stringify(v));continue;}
  const array=Array.isArray(v),items=array?v:Object.entries(v as Record<string,unknown>);
  emit(array?'[':'{');if(!items.length){emit(array?']':'}');continue;}
  stack.push({text:(pretty?'\n'+indent(depth):'')+(array?']':'}')});
  for(let i=items.length-1;i>=0;i--){if(i<items.length-1)stack.push({text:pretty?',\n':','});
   if(array)stack.push({value:items[i],depth:depth+1});
   else{const [key,val]=items[i] as [string,unknown];stack.push({value:val,depth:depth+1});stack.push({text:pretty?': ':':'});stack.push({value:key,depth:depth+1});}
   if(pretty)stack.push({text:indent(depth+1)});
  }if(pretty)emit('\n');
 }
}
export function jsonBytes(value:unknown,cap:number):number {
 let bytes=0;writeJson(value,chunk=>{bytes+=utf8ByteLength(chunk);if(bytes>cap)throw new RangeError('JSON byte budget exceeded.');});return bytes;
}
export class CappedWriter {
 private chunks:string[]=[];private bytes=0;
 append(chunk:string):void {const next=this.bytes+utf8ByteLength(chunk);if(next>DEFAULT_LIMITS.maxReportBytes)throw new DiagnosticFailure(makeDiagnostic('REPORT_TOO_LARGE','report','Report exceeds 16 MiB.'));this.bytes=next;this.chunks.push(chunk);}
 finish():string{return this.chunks.join('');}
}
