import { DEFAULT_LIMITS, LimitFailure, makeDiagnostic, utf8ByteLength } from '@flowguard/core';
import type { SourceSnapshot } from '@flowguard/core';
export async function createSnapshot(source:string,filename:string,revision:number):Promise<SourceSnapshot>{
 if(utf8ByteLength(source)>DEFAULT_LIMITS.maxSourceBytes)throw new LimitFailure(makeDiagnostic('LIMIT_SOURCE','adapter','Source exceeds 256 KiB.'));
 const bytes=new TextEncoder().encode(source),digest=await crypto.subtle.digest('SHA-256',bytes);
 const sha256=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
 return {snapshotId:`snapshot-${revision}-${sha256}`,source,filename,revision,sha256};
}
export async function currentSnapshot(source:string,filename:string,revision:number,currentRevision:()=>number):Promise<SourceSnapshot|null>{
 const snapshot=await createSnapshot(source,filename,revision);return currentRevision()===revision?snapshot:null;
}
