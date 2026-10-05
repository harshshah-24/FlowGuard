import { z } from 'zod';
import type { Expression, Statement, Block, Program } from './model.js';
import { DIAGNOSTIC_CODES, makeDiagnostic } from './diagnostics.js';
import { DEFAULT_LIMITS } from './limits.js';
import { utf8ByteLength } from './source.js';
function strict<S extends Record<string,z.ZodType>>(shape:S) {
 return z.strictObject(shape).refine(data=>Object.values(data).every(v=>v!==undefined),'Optional fields must be omitted, not explicitly undefined.');
}
export const PROTOCOL_VERSION = 1 as const;
export const ANALYZER_VERSION = '0.1.0' as const;
export const LANGUAGE_VERSION = 1 as const;
export const BYTECODE_VERSION = 1 as const;
export const ANALYSIS_STAGES = ['validate','lex','parse','semantic','lower','taint','findings','codegen','verify'] as const;
const nat = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const positive = nat.min(1);
const id = (prefix: string) => z.string().regex(new RegExp(`^${prefix}-(0|[1-9][0-9]*)$`));
const astId = id('ast'), slotId = id('slot'), nodeId = id('ir'), sourceId = id('src'), symbolId = id('sym');
const scalarType = z.enum(['string','int','bool']);
const effect = z.enum(['print','sql_query','sql_bind','shell']);
const unary = z.enum(['!','-']);
const binary = z.enum(['+','-','*','/','%','<','<=','>','>=','==','!=','&&','||']);
const valueBinary = z.enum(['+','-','*','/','%','<','<=','>','>=','==','!=']);
const requestId = z.string().min(1).max(128);
const hash = z.string().regex(/^[0-9a-f]{64}$/);
export const SourceSpanSchema = strict({ start: nat, end: nat, startLine: positive, startColumn: positive, endLine: positive, endColumn: positive }).refine(s => s.end >= s.start && s.endLine >= s.startLine && (s.endLine !== s.startLine || s.endColumn >= s.startColumn), 'Invalid source span ordering.');
export const SourceSnapshotSchema = strict({ snapshotId: z.string(), revision: nat, filename: z.string().min(1).max(255).regex(/^[^/\\\x00-\x1f]+$/), source: z.string(), sha256: hash }).refine(s => s.snapshotId === `snapshot-${s.revision}-${s.sha256}`, 'Snapshot ID does not match revision/checksum.');
export const ScalarSchema = z.discriminatedUnion('type', [strict({ type: z.literal('string'), value: z.string() }), strict({ type: z.literal('int'), value: z.number().int().min(-2147483648).max(2147483647) }), strict({ type: z.literal('bool'), value: z.boolean() })]);
export const DiagnosticSchema = strict({ code: z.enum(DIAGNOSTIC_CODES), stage: z.enum([...ANALYSIS_STAGES,'runtime','adapter','report','layout']), severity: z.enum(['error','warning','notice']), message: z.string().min(1), blocking: z.boolean(), span: SourceSpanSchema.optional(), relatedSpans: z.array(SourceSpanSchema).optional() }).refine(d => d.code === 'TEMPLATE_UNVERIFIED' ? d.severity === 'notice' && !d.blocking : d.severity === 'error' && d.blocking, 'Diagnostic severity/blocking must match its code.');
export const TOKEN_KINDS = ['IDENTIFIER','INTEGER','STRING','EOF','LET','TYPE_STRING','TYPE_INT','TYPE_BOOL','IF','ELSE','WHILE','TRUE','FALSE','INPUT','PRINT','SQL_QUERY','SQL_BIND','SHELL','LPAREN','RPAREN','LBRACE','RBRACE','COLON','SEMICOLON','COMMA','ASSIGN','PLUS','MINUS','STAR','SLASH','PERCENT','BANG','LT','LE','GT','GE','EQ','NE','AND','OR'] as const;
export const TokenSchema = strict({ id: id('tok'), kind: z.enum(TOKEN_KINDS), span: SourceSpanSchema, lexeme: z.string(), literal: ScalarSchema.optional() });
const astBase = { id: astId, span: SourceSpanSchema };
// Validate ASTs iteratively: a flat left-associated expression may be deep even
// though syntactic nesting is within 128. No hidden transport-depth restriction.
const AstShellSchema = z.discriminatedUnion('kind', [
 strict({ ...astBase, kind:z.literal('Program'), statements:z.array(z.unknown()).max(DEFAULT_LIMITS.maxAstNodes) }),
 strict({ ...astBase, kind:z.literal('Block'), statements:z.array(z.unknown()).max(DEFAULT_LIMITS.maxAstNodes) }),
 strict({ ...astBase, kind:z.literal('Declaration'),name:z.string(),nameSpan:SourceSpanSchema,type:scalarType,initializer:z.unknown() }),
 strict({ ...astBase, kind:z.literal('Assignment'),target:z.string(),targetSpan:SourceSpanSchema,value:z.unknown() }),
 strict({ ...astBase, kind:z.literal('If'),condition:z.unknown(),then:z.unknown(),optionalElse:z.unknown().optional() }),
 strict({ ...astBase, kind:z.literal('While'),condition:z.unknown(),body:z.unknown() }),
 strict({ ...astBase, kind:z.literal('EffectCall'),name:effect,args:z.array(z.unknown()).max(DEFAULT_LIMITS.maxAstNodes) }),
 strict({ ...astBase, kind:z.literal('Literal'),scalar:ScalarSchema }),
 strict({ ...astBase, kind:z.literal('Variable'),name:z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/) }),
 strict({ ...astBase, kind:z.literal('Unary'),op:unary,operand:z.unknown() }),
 strict({ ...astBase, kind:z.literal('Binary'),op:binary,left:z.unknown(),right:z.unknown() }),
 strict({ ...astBase, kind:z.literal('InputCall'),prompt:z.unknown() }),
]);
function validAst(value:unknown,expected:'Program'|'Block'|'statement'|'expression'):boolean {
 const stack:{value:unknown;expected:typeof expected}[]=[{value,expected}],seen=new Set<unknown>();let count=0;
 const expressions=new Set(['Literal','Variable','Unary','Binary','InputCall']);
 const statements=new Set(['Block','Declaration','Assignment','If','While','EffectCall']);
 while(stack.length){const item=stack.pop()!;if(seen.has(item.value)||++count>DEFAULT_LIMITS.maxAstNodes)return false;seen.add(item.value);
  const result=AstShellSchema.safeParse(item.value);if(!result.success)return false;const node=result.data;
  if(item.expected==='expression'?!expressions.has(node.kind):item.expected==='statement'?!statements.has(node.kind):node.kind!==item.expected)return false;
  const add=(value:unknown,expected:typeof item.expected)=>stack.push({value,expected});
  switch(node.kind){
   case 'Program':case 'Block':node.statements.forEach(v=>add(v,'statement'));break;
   case 'Declaration':add(node.initializer,'expression');break;
   case 'Assignment':add(node.value,'expression');break;
   case 'If':add(node.condition,'expression');add(node.then,'Block');if(node.optionalElse!==undefined)add(node.optionalElse,'Block');break;
   case 'While':add(node.condition,'expression');add(node.body,'Block');break;
   case 'EffectCall':node.args.forEach(v=>add(v,'expression'));break;
   case 'Unary':add(node.operand,'expression');break;
   case 'Binary':add(node.left,'expression');add(node.right,'expression');break;
   case 'InputCall':add(node.prompt,'expression');break;
  }
 }
 return true;
}
export const ExpressionSchema:z.ZodType<Expression>=z.custom<Expression>(v=>validAst(v,'expression'),'Invalid expression AST.');
export const BlockSchema:z.ZodType<Block>=z.custom<Block>(v=>validAst(v,'Block'),'Invalid block AST.');
export const StatementSchema:z.ZodType<Statement>=z.custom<Statement>(v=>validAst(v,'statement'),'Invalid statement AST.');
export const ProgramSchema:z.ZodType<Program>=z.custom<Program>(v=>validAst(v,'Program'),'Invalid program AST.');
export const SymbolSchema = strict({ id: symbolId, name: z.string(), type: scalarType, declarationSpan: SourceSpanSchema, scopeId: id('scope'), slotId, topLevel: z.boolean() });
export const ScopeSchema = strict({ id: id('scope'), parentId: id('scope').optional(), span: SourceSpanSchema, symbolIds: z.array(symbolId) });
export const InputSourceSchema = strict({ id: sourceId, astId, span: SourceSpanSchema, label: z.string() });
export const SemanticModelSchema = strict({ symbols: z.array(SymbolSchema).max(DEFAULT_LIMITS.maxSlots), scopes: z.array(ScopeSchema), expressionTypes: z.record(astId,scalarType), resolvedUses: z.record(astId,symbolId), inputSources: z.array(InputSourceSchema).max(DEFAULT_LIMITS.maxInputSources), diagnostics: z.array(DiagnosticSchema) });
export const TypedSlotSchema = strict({ id: slotId, type: scalarType, symbolId: symbolId.optional(), displayName: z.string(), temporary: z.boolean() });
const irBase = { id: nodeId, span: SourceSpanSchema, astId, visibleSymbolIds: z.array(symbolId) };
export const LoweredInstructionSchema = z.discriminatedUnion('op', [
 strict({ ...irBase, op: z.literal('const'), dst: slotId, scalar: ScalarSchema }),
 strict({ ...irBase, op: z.literal('copy'), dst: slotId, src: slotId }),
 strict({ ...irBase, op: z.literal('unary'), dst: slotId, operator: unary, src: slotId }),
 strict({ ...irBase, op: z.literal('binary'), dst: slotId, operator: valueBinary, left: slotId, right: slotId }),
 strict({ ...irBase, op: z.literal('input'), dst: slotId, promptSlot: slotId, sourceId }),
 strict({ ...irBase, op: z.literal('effect'), effectName: effect, argSlots: z.array(slotId).max(2), effectAstId: astId }),
 strict({ ...irBase, op: z.literal('branch'), conditionSlot: slotId, trueTarget: nodeId, falseTarget: nodeId }),
 strict({ ...irBase, op: z.literal('jump'), target: nodeId }),
 strict({ ...irBase, op: z.literal('halt') }),
]);
export const CFGEdgeSchema = strict({ id: z.string().min(1), from: nodeId, to: nodeId, kind: z.enum(['next','true','false','jump','loop-back']) });
export const LoweredProgramSchema = strict({ slots: z.array(TypedSlotSchema).max(DEFAULT_LIMITS.maxSlots), instructions: z.array(LoweredInstructionSchema).min(1).max(DEFAULT_LIMITS.maxCfgNodes), edges: z.array(CFGEdgeSchema).max(DEFAULT_LIMITS.maxCfgNodes*2), entryNodeId: nodeId, exitNodeId: nodeId, sourceMap: z.record(nodeId,SourceSpanSchema) }).superRefine((p,ctx) => {
 const ids = new Set(p.instructions.map(i => i.id));
 if (ids.size !== p.instructions.length || !ids.has(p.entryNodeId) || !ids.has(p.exitNodeId) || p.edges.some(e => !ids.has(e.from) || !ids.has(e.to))) ctx.addIssue({ code:'custom', message:'CFG has duplicate nodes or dangling references.' });
});
const sources = z.array(sourceId).max(DEFAULT_LIMITS.maxInputSources).refine(a => new Set(a).size === a.length && a.every((x,i) => i===0 || Number(a[i-1]!.slice(4)) < Number(x.slice(4))), 'Source IDs must be unique in numeric order.');
export const SerializedStateSchema = strict({ reachable:z.boolean(), entries:z.array(strict({ slotId, sourceIds:sources })).max(DEFAULT_LIMITS.maxSlots) }).refine(s => s.reachable || s.entries.length===0, 'Unreached states must have empty entries.');
export const TaintResultSchema = strict({ states:z.record(nodeId,strict({ in:SerializedStateSchema,out:SerializedStateSchema })), processedNodeCount:nat.max(DEFAULT_LIMITS.maxSolverVisits),updateCount:nat, reachedNodeIds:z.array(nodeId) });
export const FindingSchema = strict({ id:z.string().min(1),rule:z.enum(['SQL_QUERY_TEXT','SHELL_COMMAND_TEXT']),sinkNodeId:nodeId,effectAstId:astId,argIndex:z.literal(0),span:SourceSpanSchema,sourceIds:sources.min(1),explanationFactIds:z.array(z.string()),explanationComplete:z.boolean() }).refine(f => f.id===`${f.rule}:${f.effectAstId}:${f.argIndex}`, 'Finding ID is inconsistent.');
export const ExplanationFactSchema = strict({ id:z.string(),nodeId,slotId,sourceId,predecessorFactIds:z.array(z.string()),kind:z.enum(['source','copy','operator','merge','cycle']),span:SourceSpanSchema });
export const ReplayEventSchema = strict({ index:nat,nodeId,changes:z.array(strict({slotId,beforeSources:sources,afterSources:sources})),reachableBefore:z.boolean(),reachableAfter:z.boolean() });
export const ReplayTraceSchema = strict({ events:z.array(ReplayEventSchema).max(DEFAULT_LIMITS.maxReplayEvents),checkpoints:z.array(strict({ eventIndex:z.number().int().min(-1), outputs:z.record(nodeId,SerializedStateSchema) })),truncated:z.boolean(),droppedEventCount:nat });
export const OPCODES = ['PUSH_CONST','LOAD','STORE','NEG_INT','NOT_BOOL','ADD_INT','SUB_INT','MUL_INT','DIV_INT','MOD_INT','CONCAT_STRING','LT_INT','LE_INT','GT_INT','GE_INT','EQ','NE','JUMP','JUMP_IF_FALSE','INPUT','PRINT','SQL_QUERY','SQL_BIND','SHELL','HALT'] as const;
const oneOperand = new Set<string>(['PUSH_CONST','LOAD','STORE','JUMP','JUMP_IF_FALSE','INPUT']);
export const BytecodeInstructionSchema = strict({opcode:z.enum(OPCODES),operands:z.array(nat).max(1)}).refine(i => i.operands.length===(oneOperand.has(i.opcode)?1:0),'Invalid opcode arity.');
export const BytecodeArtifactSchema = strict({ version:z.literal(1),snapshotId:z.string(),sourceSha256:hash,slots:z.array(TypedSlotSchema).max(DEFAULT_LIMITS.maxSlots),sourceIds:sources,constants:z.array(ScalarSchema).max(DEFAULT_LIMITS.maxBytecodeInstructions),instructions:z.array(BytecodeInstructionSchema).min(1).max(DEFAULT_LIMITS.maxBytecodeInstructions),sourceMap:z.array(strict({pc:nat,irNodeId:nodeId,astId,span:SourceSpanSchema})),maxVerifiedStack:nat.max(DEFAULT_LIMITS.maxVmStack) }).refine(b => b.sourceMap.length===b.instructions.length && b.sourceMap.every((m,i)=>m.pc===i),'Bytecode source map is incomplete or unordered.');
const limitShape = Object.fromEntries(Object.entries(DEFAULT_LIMITS).map(([k,v]) => [k,z.literal(v)])) as { [K in keyof typeof DEFAULT_LIMITS]: z.ZodLiteral<(typeof DEFAULT_LIMITS)[K]> };
export const EffectiveLimitsSchema = strict(limitShape);
export const AnalyzeRequestSchema = strict({type:z.literal('analyze'),protocolVersion:z.literal(1),requestId,snapshot:SourceSnapshotSchema,options:strict({recordReplay:z.boolean()})});
export const AnalysisProgressSchema = strict({type:z.literal('progress'),protocolVersion:z.literal(1),requestId,revision:nat,stage:z.enum(ANALYSIS_STAGES),completedWork:nat.optional()});
export const ANALYSIS_STATUSES = ['completed','invalid-source','invalid-request','cancelled','incomplete-limit','internal-error'] as const;
export const StatisticsSchema = strict({sourceUtf8Bytes:nat,tokenCount:nat,astCount:nat,slotCount:nat,cfgNodeCount:nat,inputSourceCount:nat,processedNodeCount:nat,updateCount:nat,bytecodeCount:nat,stageDurationsMs:z.record(z.enum(ANALYSIS_STAGES),z.number().finite().nonnegative()),totalDurationMs:z.number().finite().nonnegative()});
export const ArtifactsSchema = strict({tokens:z.array(TokenSchema).max(DEFAULT_LIMITS.maxTokens).optional(),ast:ProgramSchema.optional(),semantic:SemanticModelSchema.optional(),lowered:LoweredProgramSchema.optional(),taint:TaintResultSchema.optional(),findings:z.array(FindingSchema).optional(),explanations:z.array(ExplanationFactSchema).max(DEFAULT_LIMITS.maxProvenanceFacts).optional(),replay:ReplayTraceSchema.optional(),bytecode:BytecodeArtifactSchema.optional(),disassembly:z.array(z.string()).optional()});
export const AnalysisResultSchema = strict({type:z.literal('analysis-result'),schemaVersion:z.literal(1),requestId,snapshot:SourceSnapshotSchema.optional(),analyzerVersion:z.literal(ANALYZER_VERSION),languageVersion:z.literal(1),status:z.enum(ANALYSIS_STATUSES),completedStages:z.array(z.enum(ANALYSIS_STAGES)),diagnostics:z.array(DiagnosticSchema),artifacts:ArtifactsSchema,limits:EffectiveLimitsSchema,statistics:StatisticsSchema,limitations:z.array(z.string())}).superRefine((r,ctx)=>{
 const issue=(message:string)=>ctx.addIssue({code:'custom',message});
 if(r.status!=='invalid-request' && !r.snapshot) issue('This outcome requires a source snapshot.');
 if(new Set(r.completedStages).size!==r.completedStages.length) issue('Completed stages must be unique.');
 if(r.completedStages.some((s,i)=>s!==ANALYSIS_STAGES[i])) issue('Completed stages must be a sequential prefix.');
 if(r.status==='completed') {
  if(r.completedStages.length!==ANALYSIS_STAGES.length) issue('Completed analysis requires all stages.');
  for(const key of ['tokens','ast','semantic','lowered','taint','findings','bytecode','disassembly'] as const) if(r.artifacts[key]===undefined) issue(`Completed analysis requires ${key}.`);
  if(r.diagnostics.some(d=>d.blocking)) issue('Completed analysis cannot contain blocking diagnostics.');
 } else if(r.artifacts.findings!==undefined || r.artifacts.bytecode!==undefined || r.artifacts.disassembly!==undefined) issue('Incomplete/invalid outcomes cannot publish findings or bytecode.');
 if(r.status==='invalid-request' && Object.keys(r.artifacts).length) issue('Invalid requests cannot contain compiler artifacts.');
 const gates={tokens:'lex',ast:'parse',semantic:'semantic',lowered:'lower',taint:'taint',findings:'findings',explanations:'findings',replay:'taint',bytecode:'verify',disassembly:'codegen'} as const;
 for(const key of Object.keys(gates) as (keyof typeof gates)[])if(r.artifacts[key]!==undefined&&!r.completedStages.includes(gates[key]))issue(`Artifact ${key} precedes its completed stage.`);
 if(r.artifacts.bytecode && r.snapshot && (r.artifacts.bytecode.snapshotId!==r.snapshot.snapshotId || r.artifacts.bytecode.sourceSha256!==r.snapshot.sha256)) issue('Bytecode belongs to another snapshot.');
});
export const InputsSchema = z.array(z.string().refine(s=>utf8ByteLength(s)<=DEFAULT_LIMITS.maxStringBytes,'Input string exceeds its byte limit.')).max(DEFAULT_LIMITS.maxInputItems).refine(a=>a.reduce((n,s)=>n+utf8ByteLength(s),0)<=DEFAULT_LIMITS.maxInputBytes,'Combined input exceeds its byte limit.');
export const ExecutionRequestSchema = strict({type:z.literal('execute'),protocolVersion:z.literal(1),requestId,snapshotId:z.string(),revision:nat,bytecode:BytecodeArtifactSchema,inputs:InputsSchema}).refine(r=>r.snapshotId===r.bytecode.snapshotId,'Execution snapshot differs from bytecode.');
const eventBase = {index:nat,span:SourceSpanSchema,pc:nat};
export const ExecutionEventSchema = z.discriminatedUnion('kind',[
 strict({...eventBase,kind:z.literal('input'),sourceId,prompt:z.string(),value:z.string()}),
 strict({...eventBase,kind:z.literal('print'),value:ScalarSchema}),
 strict({...eventBase,kind:z.literal('sql-query'),query:z.string(),simulated:z.literal(true)}),
 strict({...eventBase,kind:z.literal('sql-bind'),template:z.string(),value:ScalarSchema,simulated:z.literal(true)}),
 strict({...eventBase,kind:z.literal('shell'),command:z.string(),simulated:z.literal(true)}),
]);
export const RUNTIME_STATUSES = ['completed','runtime-error','cancelled','incomplete-limit','internal-error'] as const;
export const ExecutionResultSchema = strict({schemaVersion:z.literal(1),requestId,snapshotId:z.string(),revision:nat,status:z.enum(RUNTIME_STATUSES),diagnostics:z.array(DiagnosticSchema),events:z.array(ExecutionEventSchema).max(DEFAULT_LIMITS.maxVmEvents),consumedInputCount:nat.max(DEFAULT_LIMITS.maxInputItems),instructionCount:nat.max(DEFAULT_LIMITS.maxVmInstructions),elapsedMs:z.number().finite().nonnegative(),finalTopLevelValues:z.array(strict({symbolId,name:z.string(),value:ScalarSchema})),limits:EffectiveLimitsSchema}).refine(r=>r.status!=='completed'||!r.diagnostics.some(d=>d.blocking),'Completed runtime cannot contain blocking errors.');
export const ReportSchema = strict({schemaVersion:z.literal(1),analysis:AnalysisResultSchema,execution:ExecutionResultSchema.optional()}).refine(r=>!r.execution||(r.analysis.status==='completed'&&r.analysis.snapshot?.snapshotId===r.execution.snapshotId&&r.analysis.snapshot.revision===r.execution.revision),'Execution/report snapshot mismatch.');
export const ExampleProgramSchema = strict({id:z.string().min(1),title:z.string(),purpose:z.string(),filename:z.string().regex(/^[A-Za-z0-9-]+\.fg$/),expectedFindingRules:z.array(z.enum(['SQL_QUERY_TEXT','SHELL_COMMAND_TEXT'])),inputs:InputsSchema,expectedRuntimeBehavior:z.string(),limitations:z.array(z.string())});
// Reject cycles and explicit undefined values without recursive JS calls.
function plainPayload(value:unknown):boolean {
 const stack:{value:unknown;exit?:boolean}[]=[{value}],path=new Set<object>();
 while(stack.length){const frame=stack.pop()!,v=frame.value;
  if(v!==null&&typeof v==='object'){
   if(frame.exit){path.delete(v);continue;}
   if(path.has(v))return false;path.add(v);stack.push({value:v,exit:true});
   for(const child of Array.isArray(v)?Array.from(v):Object.values(v))stack.push({value:child});
  }else if(v===undefined||typeof v==='function'||typeof v==='symbol'||typeof v==='bigint')return false;
 }
 return true;
}
export function boundary<T extends z.ZodType>(schema:T) {
 return z.preprocess((value,ctx)=>{if(!plainPayload(value)){ctx.addIssue({code:'custom',message:'Payload must be finite plain data without explicit undefined fields.'});return z.NEVER;}return value;},schema);
}
export function validateAnalysisRequest(value:unknown) {
 const parsed=boundary(AnalyzeRequestSchema).safeParse(value);
 if(parsed.success) return {ok:true as const,request:parsed.data};
 const version=typeof value==='object'&&value!==null&&'protocolVersion' in value?(value as {protocolVersion:unknown}).protocolVersion:1;
 return {ok:false as const,diagnostics:[makeDiagnostic(version!==1?'SCHEMA_UNSUPPORTED':'REQUEST_INVALID','validate','Invalid analysis request.')]};
}
export const AnalysisMessageSchema = boundary(z.union([AnalysisProgressSchema,AnalysisResultSchema]));
export const ExecutionMessageSchema = boundary(ExecutionResultSchema);
