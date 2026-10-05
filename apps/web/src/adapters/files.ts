import { DEFAULT_LIMITS, decodeUtf8, DiagnosticFailure, LimitFailure, makeDiagnostic, SourceFailure } from '@flowguard/core';
export function displayFilename(name:string):string{
 const base=name.split(/[\\/]/).at(-1)?.replace(/[\x00-\x1f]/g,'').slice(0,255);return base||'program.fg';
}
export async function readSourceFile(file:File):Promise<{source:string;filename:string}>{
 if(file.size>DEFAULT_LIMITS.maxSourceBytes)throw new LimitFailure(makeDiagnostic('FILE_TOO_LARGE','adapter','Source file exceeds 256 KiB.'));
 try{return {source:decodeUtf8(new Uint8Array(await file.arrayBuffer())),filename:displayFilename(file.name)};}
 catch(error){if(error instanceof DiagnosticFailure)throw error;throw new SourceFailure(makeDiagnostic('FILE_READ','adapter','Could not read the selected file. Try selecting it again.'));}
}
