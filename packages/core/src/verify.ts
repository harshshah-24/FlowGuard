import { BytecodeArtifactSchema, boundary } from './contracts.js';
import { DiagnosticFailure, makeDiagnostic } from './diagnostics.js';
import type { BudgetGuard } from './limits.js';
import type { BytecodeArtifact, ScalarType } from './model.js';

export function verifyBytecode(raw:BytecodeArtifact,guard:BudgetGuard):number {
 const fail=(message:string):never=>{throw new DiagnosticFailure(makeDiagnostic('BYTECODE_INVALID','verify',message));};
 guard.checkpoint('verify',true);
 const parsed=boundary(BytecodeArtifactSchema).safeParse(raw);if(!parsed.success)fail('Invalid bytecode schema or version.');const artifact=parsed.data!;
 const code=artifact.instructions,count=code.length,slotCount=artifact.slots.length;
 if(artifact.slots.some((s,i)=>s.id!==`slot-${i}`)||new Set(artifact.slots.flatMap(s=>s.symbolId?[s.symbolId]:[])).size!==artifact.slots.filter(s=>s.symbolId).length)fail('Invalid or duplicate slot/symbol identity.');
 if(!new RegExp(`^snapshot-(0|[1-9][0-9]*)-${artifact.sourceSha256}$`).test(artifact.snapshotId))fail('Bytecode checksum identity mismatch.');
 if(artifact.slots.some(s=>s.temporary?s.symbolId!==undefined:s.symbolId===undefined))fail('Invalid symbol/temporary slot metadata.');
 const successors:number[][]=Array.from({length:count},()=>[]),predecessors:number[][]=Array.from({length:count},()=>[]);
 for(let pc=0;pc<count;pc++){guard.checkpoint('verify');const i=code[pc]!,operand=i.operands[0]!;
  if((i.opcode==='LOAD'||i.opcode==='STORE')&&operand>=slotCount)fail('Slot operand out of range.');
  if(i.opcode==='PUSH_CONST'&&operand>=artifact.constants.length)fail('Constant operand out of range.');
  if(i.opcode==='INPUT'&&operand>=artifact.sourceIds.length)fail('Input source operand out of range.');
  if(i.opcode==='JUMP'||i.opcode==='JUMP_IF_FALSE'){if(operand>=count)fail('Jump target out of range.');successors[pc]!.push(operand);}
  if(i.opcode!=='HALT'&&i.opcode!=='JUMP'){if(pc+1>=count)fail('Bytecode falls off its end.');successors[pc]!.push(pc+1);}
  for(const target of successors[pc]!)predecessors[target]!.push(pc);
 }
 const reached=new Set<number>(),pending=[0];while(pending.length){guard.checkpoint('verify');const pc=pending.pop()!;if(reached.has(pc))continue;reached.add(pc);pending.push(...successors[pc]!);}
 const stacks:(readonly ScalarType[]|undefined)[]=Array(count);stacks[0]=[];const queue=[0];let head=0,visits=0,maxStack=0;
 while(head<queue.length){guard.checkCount('maxVerifierVisits',++visits,'LIMIT_BYTECODE','verify');guard.checkpoint('verify');const pc=queue[head++]!,i=code[pc]!,stack=[...stacks[pc]!];
  const pop=(type?:ScalarType)=>{const actual=stack.pop();if(!actual||type&&actual!==type)fail('Stack underflow or operand type mismatch.');return actual!;};
  const binary=(input:ScalarType,output:ScalarType)=>{pop(input);pop(input);stack.push(output);};
  switch(i.opcode){
   case 'PUSH_CONST':stack.push(artifact.constants[i.operands[0]!]!.type);break;
   case 'LOAD':stack.push(artifact.slots[i.operands[0]!]!.type);break;
   case 'STORE':pop(artifact.slots[i.operands[0]!]!.type);break;
   case 'NEG_INT':pop('int');stack.push('int');break;
   case 'NOT_BOOL':pop('bool');stack.push('bool');break;
   case 'ADD_INT':case 'SUB_INT':case 'MUL_INT':case 'DIV_INT':case 'MOD_INT':binary('int','int');break;
   case 'CONCAT_STRING':binary('string','string');break;
   case 'LT_INT':case 'LE_INT':case 'GT_INT':case 'GE_INT':binary('int','bool');break;
   case 'EQ':case 'NE':{const right=pop();pop(right);stack.push('bool');break;}
   case 'JUMP_IF_FALSE':pop('bool');break;
   case 'INPUT':pop('string');stack.push('string');break;
   case 'PRINT':pop();break;
   case 'SQL_QUERY':case 'SHELL':pop('string');break;
   case 'SQL_BIND':pop();pop('string');break;
   case 'HALT':if(stack.length)fail('HALT requires an empty stack.');break;
   case 'JUMP':break;
  }
  maxStack=Math.max(maxStack,stack.length);if(maxStack>guard.limits.maxVmStack)fail('Verified stack exceeds its limit.');
  for(const target of successors[pc]!){const prior=stacks[target];if(prior){if(prior.length!==stack.length||prior.some((t,j)=>t!==stack[j]))fail('Inconsistent stack types at join.');}else{stacks[target]=stack;queue.push(target);}}
 }
 // Greatest fixed point, represented by bounded bitsets rather than sets of
 // 4,000 strings per PC. LOAD checks run only after convergence.
 const words=Math.ceil(slotCount/32),universe=new Uint32Array(words).fill(0xffffffff),empty=new Uint32Array(words);
 const incoming:(Uint32Array|undefined)[]=Array(count),outgoing:(Uint32Array|undefined)[]=Array(count);
 for(const pc of reached){incoming[pc]=universe;outgoing[pc]=universe;}
 let work=[...reached].sort((a,b)=>a-b),cursor=0;const scheduled=Array<boolean>(count).fill(false);work.forEach(pc=>{scheduled[pc]=true;});visits=0;
 while(cursor<work.length){const pc=work[cursor++]!;scheduled[pc]=false;guard.checkCount('maxVerifierVisits',++visits,'LIMIT_BYTECODE','verify');guard.checkpoint('verify');
  const merged=pc===0?empty.slice():universe.slice();for(const before of predecessors[pc]!)if(reached.has(before)){const out=outgoing[before]!;for(let w=0;w<words;w++)merged[w]=merged[w]!&out[w]!;}
  incoming[pc]=merged;const next=merged.slice(),i=code[pc]!;if(i.opcode==='STORE'){const slot=i.operands[0]!;next[slot>>>5]=next[slot>>>5]!|(1<<(slot&31));}
  const old=outgoing[pc]!;if(next.some((word,w)=>word!==old[w])){outgoing[pc]=next;for(const target of successors[pc]!)if(!scheduled[target]){scheduled[target]=true;work.push(target);}}
  if(cursor>4096){work=work.slice(cursor);cursor=0;}
 }
 for(const pc of reached){guard.checkpoint('verify');const i=code[pc]!;if(i.opcode==='LOAD'){const slot=i.operands[0]!;if(!(incoming[pc]![slot>>>5]!&(1<<(slot&31))))fail('LOAD reads a slot not definitely initialized.');}}
 guard.checkpoint('verify',true);return maxStack;
}
