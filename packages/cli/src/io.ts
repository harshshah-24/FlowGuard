import { open, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';
import { DEFAULT_LIMITS, InputsSchema, boundary, utf8ByteLength, type SourceSnapshot } from '@flowguard/core';
export class FileFailure extends Error {constructor(readonly code:string,message:string){super(message);}}
async function readBounded(path:string,maxBytes:number):Promise<Uint8Array> {
 const file=await open(path,'r').catch(()=>{throw new FileFailure('FILE_READ','Cannot open input file.');});
 try{if((await file.stat()).size>maxBytes)throw new FileFailure('FILE_TOO_LARGE','Input file exceeds its byte limit.');
  const buffer=new Uint8Array(maxBytes+1);let offset=0;
  while(offset<buffer.length){const read=await file.read(buffer,offset,buffer.length-offset,null);if(!read.bytesRead)break;offset+=read.bytesRead;}
  if(offset>maxBytes)throw new FileFailure('FILE_TOO_LARGE','Input file exceeds its byte limit.');return buffer.subarray(0,offset);
 }catch(error){if(error instanceof FileFailure)throw error;throw new FileFailure('FILE_READ','Cannot read input file.');}finally{await file.close();}
}
function decode(bytes:Uint8Array):string {try{return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw new FileFailure('FILE_ENCODING','Input must be valid UTF-8.');}}
export async function readSnapshot(path:string):Promise<SourceSnapshot> {const source=decode(await readBounded(path,DEFAULT_LIMITS.maxSourceBytes)),sha256=createHash('sha256').update(source).digest('hex');return {source,filename:basename(path),revision:0,sha256,snapshotId:`snapshot-0-${sha256}`};}
export async function readInputs(path:string):Promise<string[]> {try{return boundary(InputsSchema).parse(JSON.parse(decode(await readBounded(path,DEFAULT_LIMITS.maxReportBytes))));}catch(error){if(error instanceof FileFailure)throw error;throw new FileFailure('INPUTS_INVALID','Inputs must be a bounded JSON array of strings.');}}
export async function writeOutput(path:string,text:string,overwrite:boolean):Promise<void> {if(utf8ByteLength(text)>DEFAULT_LIMITS.maxReportBytes)throw new FileFailure('REPORT_TOO_LARGE','Report exceeds its byte limit.');try{await writeFile(path,text,{encoding:'utf8',flag:overwrite?'w':'wx'});}catch(error){const exists=typeof error==='object'&&error!==null&&'code' in error&&error.code==='EEXIST';throw new FileFailure(exists?'OUTPUT_EXISTS':'OUTPUT_WRITE',exists?'Output exists; use --overwrite explicitly.':'Cannot write output file.');}}
