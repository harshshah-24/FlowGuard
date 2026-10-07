import { BytecodeArtifactSchema, LoweredProgramSchema, SourceSnapshotSchema, boundary } from './contracts.js';
import type { BudgetGuard } from './limits.js';
import type { BytecodeArtifact, BytecodeInstruction, LoweredProgram, Scalar, SourceSnapshot } from './model.js';
import { utf8ByteLength } from './source.js';

export function generateBytecode(program:LoweredProgram,snapshot:SourceSnapshot,guard:BudgetGuard):BytecodeArtifact {
 guard.checkpoint('codegen',true);guard.checkCount('maxSourceBytes',utf8ByteLength(snapshot.source),'LIMIT_SOURCE','codegen');
 boundary(SourceSnapshotSchema).parse(snapshot);boundary(LoweredProgramSchema).parse(program);
 const exit=program.instructions.at(-1)!;
 if(exit.op!=='halt'||exit.id!==program.exitNodeId)throw new Error('Lowered program must end with its exit HALT.');
 const topLevelSymbolIds=[...exit.visibleSymbolIds].sort((a,b)=>Number(a.slice(4))-Number(b.slice(4)));
 const constants:Scalar[]=[],constantIds=new Map<string,number>(),instructions:BytecodeInstruction[]=[],sourceMap:BytecodeArtifact['sourceMap']=[];
 const starts=new Map<string,number>(),patches:{pc:number;target:string}[]=[];
 const sourceIds=[...new Set(program.instructions.filter(n=>n.op==='input').map(n=>n.sourceId))].sort((a,b)=>Number(a.slice(4))-Number(b.slice(4)));
 const slot=(id:string)=>Number(id.slice(5));
 for(const node of program.instructions){guard.checkpoint('codegen');starts.set(node.id,instructions.length);
  const emit=(opcode:BytecodeInstruction['opcode'],...operands:number[])=>{guard.checkCount('maxBytecodeInstructions',instructions.length+1,'LIMIT_BYTECODE','codegen');const pc=instructions.length;instructions.push({opcode,operands});sourceMap.push({pc,irNodeId:node.id,astId:node.astId,span:node.span});return pc;};
  const load=(id:string)=>emit('LOAD',slot(id)),store=(id:string)=>emit('STORE',slot(id));
  switch(node.op){
   case 'const':{const key=JSON.stringify(node.scalar);let index=constantIds.get(key);if(index===undefined){index=constants.length;constantIds.set(key,index);constants.push(node.scalar);}emit('PUSH_CONST',index);store(node.dst);break;}
   case 'copy':load(node.src);store(node.dst);break;
   case 'unary':load(node.src);emit(node.operator==='!'?'NOT_BOOL':'NEG_INT');store(node.dst);break;
   case 'binary':{load(node.left);load(node.right);const op=node.operator;const arithmetic={'+':'ADD_INT','-':'SUB_INT','*':'MUL_INT','/':'DIV_INT','%':'MOD_INT','<':'LT_INT','<=':'LE_INT','>':'GT_INT','>=':'GE_INT','==':'EQ','!=':'NE'} as const;const opcode=op==='+'&&program.slots[slot(node.dst)]?.type==='string'?'CONCAT_STRING':arithmetic[op];emit(opcode);store(node.dst);break;}
   case 'input':load(node.promptSlot);emit('INPUT',sourceIds.indexOf(node.sourceId));store(node.dst);break;
   case 'effect':node.argSlots.forEach(load);emit(({print:'PRINT',sql_query:'SQL_QUERY',sql_bind:'SQL_BIND',shell:'SHELL'} as const)[node.effectName]);break;
   case 'branch':load(node.conditionSlot);patches.push({pc:emit('JUMP_IF_FALSE',0),target:node.falseTarget},{pc:emit('JUMP',0),target:node.trueTarget});break;
   case 'jump':patches.push({pc:emit('JUMP',0),target:node.target});break;
   case 'halt':emit('HALT');break;
  }
 }
 for(const patch of patches){const pc=starts.get(patch.target);if(pc===undefined)throw new Error('Unknown lowered jump target.');instructions[patch.pc]!.operands[0]=pc;}
 const artifact:BytecodeArtifact={version:1,snapshotId:snapshot.snapshotId,sourceSha256:snapshot.sha256,slots:program.slots,topLevelSymbolIds,sourceIds,constants,instructions,sourceMap,maxVerifiedStack:0};
 BytecodeArtifactSchema.parse(artifact);guard.checkpoint('codegen',true);return artifact;
}
export function disassembleBytecode(artifact:BytecodeArtifact):string[] {return artifact.instructions.map((i,pc)=>`${pc.toString().padStart(5,'0')}  ${i.opcode}${i.operands.length?' '+i.operands.join(' '):''}  ; ${artifact.sourceMap[pc]!.irNodeId} ${artifact.sourceMap[pc]!.span.startLine}:${artifact.sourceMap[pc]!.span.startColumn}`);}
