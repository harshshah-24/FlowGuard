import { parentPort,workerData } from 'node:worker_threads';
import { runCli } from './run.js';
const data=workerData as {args:string[];cancellation:SharedArrayBuffer},cancellation=new Int32Array(data.cancellation);
const code=await runCli(data.args,{out:text=>parentPort!.postMessage({type:'out',text}),err:text=>parentPort!.postMessage({type:'err',text}),cancelled:()=>Atomics.load(cancellation,0)!==0});
parentPort!.postMessage({type:'done',code});
