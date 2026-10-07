import { Worker } from 'node:worker_threads';
// Keep signal handling responsive while the shared core runs synchronously.
const cancellation=new Int32Array(new SharedArrayBuffer(4));
const interrupt=()=>Atomics.store(cancellation,0,1);
process.on('SIGINT',interrupt);
try {
 process.exitCode=await new Promise<number>(resolve=>{
  const worker=new Worker(new URL('./cli.worker.js',import.meta.url),{workerData:{args:process.argv.slice(2),cancellation:cancellation.buffer}});
  let finished=false;
  worker.on('message',(message:{type:'out'|'err'|'done';text?:string;code?:number})=>{
   if(message.type==='out')process.stdout.write(message.text!);
   else if(message.type==='err')process.stderr.write(message.text!);
   else {finished=true;resolve(message.code!);void worker.terminate();}
  });
  worker.on('error',()=>{process.stderr.write('ENGINE_INTERNAL: CLI worker failed.\n');resolve(Atomics.load(cancellation,0)?130:3);});
  worker.on('exit',()=>{if(!finished)resolve(Atomics.load(cancellation,0)?130:3);});
 });
}finally{process.removeListener('SIGINT',interrupt);}
