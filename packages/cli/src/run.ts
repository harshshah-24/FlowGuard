import { performance } from 'node:perf_hooks';
import { ANALYZER_VERSION, analyzeSource, runBytecode, buildReport, serializeReport, DiagnosticFailure } from '@flowguard/core';
import { parseOptions, type CliOptions } from './options.js';
import { FileFailure, readInputs, readSnapshot, writeOutput } from './io.js';
export interface CliStreams {out:(text:string)=>void;err:(text:string)=>void;cancelled?:()=>boolean}
export async function runCli(args:string[],streams:CliStreams):Promise<number> {
 let options:CliOptions;
 try{options=parseOptions(args);}catch(error){streams.err(`REQUEST_INVALID: ${error instanceof Error?error.message:'Invalid CLI options.'}\n`);return 2;}
 try{
  if(options.help){streams.out('Usage: flowguard <source.fg> [--format json|markdown] [--output path] [--overwrite] [--trace] [--run] [--inputs file]\nAnalyze source and optionally run verified bytecode with supplied JSON string-array inputs. SQL and shell effects are simulated.\n');return 0;}
  if(options.version){streams.out(`FlowGuard ${ANALYZER_VERSION}\n`);return 0;}
  const snapshot=await readSnapshot(options.source!);const inputs=options.inputs?await readInputs(options.inputs):[];
  let last=-Infinity;
  const analysis=analyzeSource({type:'analyze',protocolVersion:1,requestId:'cli-1',snapshot,options:{recordReplay:options.trace}},{nowMs:()=>performance.now(),checkpointAbort:streams.cancelled??(()=>false),onProgress:p=>{const now=performance.now();if(now-last>=100){streams.err(`Stage: ${p.stage}\n`);last=now;}}});
  const execution=options.run&&analysis.status==='completed'?runBytecode({type:'execute',protocolVersion:1,requestId:'cli-execution-1',snapshotId:snapshot.snapshotId,revision:snapshot.revision,bytecode:analysis.artifacts.bytecode!,inputs},{nowMs:()=>performance.now(),checkpointAbort:streams.cancelled??(()=>false)}):undefined;
  const text=serializeReport(buildReport(analysis,execution),options.format);if(options.output)await writeOutput(options.output,text,options.overwrite);else streams.out(text);
  if(execution&&execution.status!=='completed')return execution.status==='cancelled'?130:3;
  return analysis.status==='cancelled'?130:analysis.status==='invalid-source'||analysis.status==='invalid-request'?2:analysis.status!=='completed'?3:analysis.artifacts.findings!.length?1:0;
 }catch(error){const code=error instanceof FileFailure?error.code:error instanceof DiagnosticFailure?error.diagnostic.code:'ENGINE_INTERNAL';streams.err(`${code}: ${error instanceof FileFailure||error instanceof DiagnosticFailure?error.message:'CLI operation failed.'}\n`);return error instanceof FileFailure&&!['OUTPUT_EXISTS','OUTPUT_WRITE','REPORT_TOO_LARGE'].includes(error.code)?2:3;}
}
