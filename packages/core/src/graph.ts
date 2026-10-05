import { preorder } from './ast.js';
import type { BudgetGuard } from './limits.js';
import type { CFGEdge, LoweredInstruction, LoweredProgram, Program, ScalarType, SemanticModel } from './model.js';
export function deriveEdges(instructions:LoweredInstruction[],loopBack:ReadonlySet<string>=new Set()):CFGEdge[]{
 const edges:CFGEdge[]=[];
 const add=(from:string,to:string,kind:CFGEdge['kind'])=>edges.push({id:`edge-${edges.length}`,from,to,kind});
 instructions.forEach((i,index)=>{if(i.op==='branch'){add(i.id,i.trueTarget,'true');add(i.id,i.falseTarget,'false');}else if(i.op==='jump')add(i.id,i.target,loopBack.has(i.id)?'loop-back':'jump');else if(i.op!=='halt'){const next=instructions[index+1];if(!next)throw new Error('Nonterminal instruction without successor.');add(i.id,next.id,'next');}});return edges;
}
export function adjacency(program:LoweredProgram){
 const predecessors=new Map<string,CFGEdge[]>(),successors=new Map<string,CFGEdge[]>();
 for(const i of program.instructions){predecessors.set(i.id,[]);successors.set(i.id,[]);}
 for(const edge of program.edges){const before=predecessors.get(edge.to),after=successors.get(edge.from);if(!before||!after)throw new Error('Dangling CFG edge.');before.push(edge);after.push(edge);}return {predecessors,successors};
}
export function validateLoweredProgram(p:LoweredProgram,ast:Program,semantic:SemanticModel,guard:BudgetGuard):void{
 const fail=(message:string):never=>{throw new Error(`Invalid lowered program: ${message}`);};
 guard.checkCount('maxCfgNodes',p.instructions.length,'LIMIT_CFG','lower');guard.checkCount('maxSlots',p.slots.length,'LIMIT_SLOTS','lower');
 const nodes=new Map(preorder(ast).map(n=>[n.id,n])),instructions=new Set(p.instructions.map(i=>i.id)),symbols=new Map(semantic.symbols.map(s=>[s.id,s])),sources=new Map(semantic.inputSources.map(s=>[s.id,s]));
 const slots=new Map(p.slots.map(s=>[s.id,s]));
 if(!p.instructions.length||slots.size!==p.slots.length||instructions.size!==p.instructions.length)fail('empty graph or duplicate IDs');
 if(p.entryNodeId!==p.instructions[0]!.id||p.exitNodeId!==p.instructions.at(-1)!.id||p.instructions.at(-1)!.op!=='halt')fail('invalid entry/exit');
 if(Object.keys(p.sourceMap).length!==p.instructions.length)fail('incomplete source map');
 p.slots.forEach((s,index)=>{if(s.id!==`slot-${index}`)fail('unstable slot ID');if(s.temporary?s.symbolId!==undefined:!s.symbolId||symbols.get(s.symbolId)?.slotId!==s.id||symbols.get(s.symbolId)?.type!==s.type)fail('invalid symbol slot');});
 const type=(id:string):ScalarType=>slots.get(id)?.type??fail('unknown slot');
 const same=(a:string,b:string)=>{if(type(a)!==type(b))fail('copy type mismatch');};
 p.instructions.forEach((i,index)=>{
  guard.checkpoint('lower');const owner=nodes.get(i.astId);if(i.id!==`ir-${index}`||!owner)fail('invalid instruction identity/owner');
  if(JSON.stringify(i.span)!==JSON.stringify(owner!.span)||JSON.stringify(p.sourceMap[i.id])!==JSON.stringify(i.span))fail('invalid source mapping');
  if(new Set(i.visibleSymbolIds).size!==i.visibleSymbolIds.length||i.visibleSymbolIds.some(id=>!symbols.has(id)))fail('invalid visible symbols');
  switch(i.op){
   case 'const':if(type(i.dst)!==i.scalar.type)fail('constant type mismatch');break;
   case 'copy':same(i.dst,i.src);break;
   case 'unary':if(type(i.dst)!==(i.operator==='!'?'bool':'int')||type(i.src)!==type(i.dst))fail('unary type mismatch');break;
   case 'binary':{const left=type(i.left),right=type(i.right),dst=type(i.dst);if(left!==right)fail('binary operand mismatch');const equality=i.operator==='=='||i.operator==='!=';const relational=['<','<=','>','>='].includes(i.operator);if(equality?dst!=='bool':relational?left!=='int'||dst!=='bool':i.operator==='+'?(left!=='int'&&left!=='string')||dst!==left:left!=='int'||dst!=='int')fail('binary type mismatch');break;}
   case 'input':if(type(i.dst)!=='string'||type(i.promptSlot)!=='string'||sources.get(i.sourceId)?.astId!==i.astId)fail('invalid input');break;
   case 'effect':if(i.effectAstId!==i.astId||owner!.kind!=='EffectCall'||i.argSlots.length!==(i.effectName==='sql_bind'?2:1))fail('invalid effect');i.argSlots.forEach(type);if(i.effectName!=='print'&&type(i.argSlots[0]!)!=='string')fail('effect type mismatch');break;
   case 'branch':if(type(i.conditionSlot)!=='bool'||!instructions.has(i.trueTarget)||!instructions.has(i.falseTarget))fail('invalid branch');break;
   case 'jump':if(!instructions.has(i.target))fail('invalid jump');break;
   case 'halt':if(index!==p.instructions.length-1)fail('multiple exits');break;
  }
 });
 const back=new Set(p.edges.filter(e=>e.kind==='loop-back').map(e=>e.from));const expected=deriveEdges(p.instructions,back);
 if(JSON.stringify(expected)!==JSON.stringify(p.edges))fail('edges do not match instruction targets');
 for(const edge of p.edges)if(edge.kind==='loop-back'&&(p.instructions[Number(edge.from.slice(3))]?.op!=='jump'||Number(edge.to.slice(3))>Number(edge.from.slice(3))))fail('invalid loop-back');
 adjacency(p);
}
