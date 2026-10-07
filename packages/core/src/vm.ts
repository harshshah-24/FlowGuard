import { ExecutionRequestSchema, InputsSchema, boundary } from './contracts.js';
import { BudgetGuard, DEFAULT_LIMITS, type BudgetHooks } from './limits.js';
import { DiagnosticFailure, LimitFailure, CancelledFailure, makeDiagnostic, type DiagnosticCode } from './diagnostics.js';
import { verifyBytecode } from './verify.js';
import { utf8ByteLength } from './source.js';
import { jsonBytes } from './json.js';
import type { BytecodeArtifact, ExecutionEvent, ExecutionRequest, ExecutionResult, Scalar, SourceSpan } from './model.js';
type EventPayload<T=ExecutionEvent> = T extends ExecutionEvent ? Omit<T,'index'|'pc'|'span'> : never;

export function runBytecode(raw:ExecutionRequest,hooks:BudgetHooks):ExecutionResult {
 const guard=new BudgetGuard(hooks,'execution');
 const result:ExecutionResult={schemaVersion:1,requestId:typeof raw?.requestId==='string'&&raw.requestId.length>0&&raw.requestId.length<=128?raw.requestId:'invalid-execution',snapshotId:typeof raw?.snapshotId==='string'?raw.snapshotId:'invalid-snapshot',revision:Number.isSafeInteger(raw?.revision)&&raw.revision>=0?raw.revision:0,status:'internal-error',diagnostics:[],events:[],consumedInputCount:0,instructionCount:0,elapsedMs:0,finalTopLevelValues:[],limits:DEFAULT_LIMITS};
 let slots:(Scalar|undefined)[]=[],activeSpan:SourceSpan|undefined,verified:BytecodeArtifact|undefined;
 const fail=(code:DiagnosticCode,message:string):never=>{throw new DiagnosticFailure(makeDiagnostic(code,'runtime',message,activeSpan));};
 try {
  guard.checkpoint('runtime',true);
  if(!boundary(InputsSchema).safeParse(raw?.inputs).success)fail('INPUTS_INVALID','Inputs must be a bounded JSON array of strings.');
  const parsed=boundary(ExecutionRequestSchema).safeParse(raw);if(!parsed.success)fail('BYTECODE_INVALID','Invalid execution envelope or bytecode.');const request=parsed.data!;
  verifyBytecode(request.bytecode,guard);
  verified=request.bytecode;
  const b=request.bytecode,code=b.instructions,stack:Scalar[]=[];slots=Array(b.slots.length);let pc=0,storage=0,eventBytes=2;
  const bytes=(value:Scalar|undefined)=>value?.type==='string'?utf8ByteLength(value.value):0;
  const checkString=(value:Scalar)=>{guard.checkCount('maxStringBytes',bytes(value),'LIMIT_VM_STRING','runtime');};
  const push=(value:Scalar)=>{checkString(value);guard.checkCount('maxVmStack',stack.length+1,'LIMIT_VM_STACK','runtime');guard.checkCount('maxVmStorageBytes',storage+bytes(value),'LIMIT_VM_STORAGE','runtime');stack.push(value);storage+=bytes(value);};
  const pop=():Scalar=>{const value=stack.pop();if(!value)fail('BYTECODE_INVALID','Runtime stack underflow.');storage-=bytes(value);return value!;};
  const int=():bigint=>{const value=pop();if(value.type!=='int')fail('BYTECODE_INVALID','Expected an integer.');return BigInt(value.value as number);};
  const string=():string=>{const value=pop();if(value.type!=='string')fail('BYTECODE_INVALID','Expected a string.');return value.value as string;};
  const checked=(n:bigint):Scalar=>{if(n< -2147483648n||n>2147483647n)fail('RUNTIME_INT_OVERFLOW','Signed 32-bit arithmetic overflow.');return {type:'int',value:Number(n)};};
  const event=(payload:EventPayload)=>{guard.checkpoint('runtime',true);guard.checkCount('maxVmEvents',result.events.length+1,'LIMIT_VM_EVENTS','runtime');const item={...payload,index:result.events.length,pc,span:b.sourceMap[pc]!.span} as ExecutionEvent;let size:number;try{size=jsonBytes(item,guard.limits.maxVmOutputBytes-eventBytes)+1;}catch{throw new LimitFailure(makeDiagnostic('LIMIT_VM_OUTPUT','runtime','Serialized runtime event output limit exceeded.'));}guard.checkCount('maxVmOutputBytes',eventBytes+size,'LIMIT_VM_OUTPUT','runtime');eventBytes+=size;result.events.push(item);};
  while(true){guard.checkpoint('runtime');guard.checkCount('maxVmInstructions',result.instructionCount+1,'LIMIT_VM_INSTRUCTIONS','runtime');result.instructionCount++;
   const instruction=code[pc];if(!instruction)fail('BYTECODE_INVALID','Runtime program counter out of range.');activeSpan=b.sourceMap[pc]!.span;const i=instruction!,operand=i.operands[0]!;let next=pc+1;
   switch(i.opcode){
    case 'PUSH_CONST':push(b.constants[operand]!);break;
    case 'LOAD':{const value=slots[operand];if(!value)fail('BYTECODE_INVALID','Runtime LOAD is uninitialized.');push(value!);break;}
    case 'STORE':{const value=pop(),retained=storage-bytes(slots[operand])+bytes(value);guard.checkCount('maxVmStorageBytes',retained,'LIMIT_VM_STORAGE','runtime');slots[operand]=value;storage=retained;break;}
    case 'NEG_INT':push(checked(-int()));break;
    case 'NOT_BOOL':{const value=pop();push({type:'bool',value:!(value.value as boolean)});break;}
    case 'ADD_INT':case 'SUB_INT':case 'MUL_INT':case 'DIV_INT':case 'MOD_INT':{const right=int(),left=int();if((i.opcode==='DIV_INT'||i.opcode==='MOD_INT')&&right===0n)fail('RUNTIME_DIV_ZERO','Division or remainder by zero.');const value=i.opcode==='ADD_INT'?left+right:i.opcode==='SUB_INT'?left-right:i.opcode==='MUL_INT'?left*right:i.opcode==='DIV_INT'?left/right:left%right;push(checked(value));break;}
    case 'CONCAT_STRING':{const right=string(),left=string();guard.checkCount('maxStringBytes',utf8ByteLength(left)+utf8ByteLength(right),'LIMIT_VM_STRING','runtime');push({type:'string',value:left+right});break;}
    case 'LT_INT':case 'LE_INT':case 'GT_INT':case 'GE_INT':{const right=int(),left=int();push({type:'bool',value:i.opcode==='LT_INT'?left<right:i.opcode==='LE_INT'?left<=right:i.opcode==='GT_INT'?left>right:left>=right});break;}
    case 'EQ':case 'NE':{const right=pop(),left=pop();push({type:'bool',value:i.opcode==='EQ'?left.value===right.value:left.value!==right.value});break;}
    case 'JUMP':next=operand;guard.checkpoint('runtime',true);break;
    case 'JUMP_IF_FALSE':{const condition=pop();if(!condition.value)next=operand;guard.checkpoint('runtime',true);break;}
    case 'INPUT':{const prompt=string(),supplied=request.inputs[result.consumedInputCount];if(supplied===undefined)fail('RUNTIME_INPUT_EXHAUSTED','Supplied runtime input is exhausted.');const value=supplied!;event({kind:'input',sourceId:b.sourceIds[operand]!,prompt,value});result.consumedInputCount++;push({type:'string',value});break;}
    case 'PRINT':{const value=pop();event({kind:'print',value});break;}
    case 'SQL_QUERY':{const query=string();event({kind:'sql-query',query,simulated:true});break;}
    case 'SQL_BIND':{const value=pop(),template=string();event({kind:'sql-bind',template,value,simulated:true});break;}
    case 'SHELL':{const command=string();event({kind:'shell',command,simulated:true});break;}
    case 'HALT':if(stack.length)fail('BYTECODE_INVALID','HALT stack must be empty.');result.status='completed';guard.checkpoint('runtime',true);break;
   }
   if(i.opcode==='HALT')break;pc=next;
  }
 }catch(error){result.status=error instanceof CancelledFailure?'cancelled':error instanceof LimitFailure?'incomplete-limit':error instanceof DiagnosticFailure&&['RUNTIME_INPUT_EXHAUSTED','RUNTIME_DIV_ZERO','RUNTIME_INT_OVERFLOW'].includes(error.diagnostic.code)?'runtime-error':'internal-error';result.diagnostics.push(error instanceof DiagnosticFailure?error.diagnostic:makeDiagnostic('ENGINE_INTERNAL','runtime','Execution failed internally. Please retry.'));}
 // Project only verified scope identities and values actually stored before exit.
 // This also preserves initialized top-level values when execution fails or stops.
 if(verified){
  const userSlots=new Map(verified.slots.flatMap((slot,index)=>slot.symbolId?[[slot.symbolId,{slot,index}] as const]:[]));
  for(const symbolId of verified.topLevelSymbolIds){const {slot,index}=userSlots.get(symbolId)!,value=slots[index];if(value!==undefined)result.finalTopLevelValues.push({symbolId,name:slot.displayName,value});}
 }
 result.elapsedMs=guard.elapsedMs;return result;
}
