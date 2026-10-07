import { DEFAULT_LIMITS, utf8ByteLength, serializeReport, buildReport, type AnalysisResult, type ExecutionResult } from '@flowguard/core';
import { displayFilename } from './files.js';
export function downloadSource(source:string,filename:string):void{
 if(utf8ByteLength(source)>DEFAULT_LIMITS.maxSourceBytes)throw new Error('Source exceeds 256 KiB.');
 const url=URL.createObjectURL(new Blob([source],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');
 try{link.href=url;link.download=displayFilename(filename);document.body.append(link);link.click();}
 catch(error){URL.revokeObjectURL(url);throw error;}
 finally{link.remove();}
 // Allow the browser to consume the URL before releasing it.
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function downloadReport(analysis:AnalysisResult,format:'json'|'markdown',execution?:ExecutionResult):void {
 const text=serializeReport(buildReport(analysis,execution),format),base=displayFilename(analysis.snapshot?.filename??'program.fg').replace(/\.fg$/i,'');
 const url=URL.createObjectURL(new Blob([text],{type:format==='json'?'application/json':'text/markdown;charset=utf-8'})),link=document.createElement('a');
 try{link.href=url;link.download=`${base}.flowguard.${format==='json'?'json':'md'}`;document.body.append(link);link.click();}catch(error){URL.revokeObjectURL(url);throw error;}finally{link.remove();}
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
