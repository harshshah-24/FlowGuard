import { SourceFailure } from './diagnostics.js';
import { deriveEdges, validateLoweredProgram } from './graph.js';
import type { BudgetGuard } from './limits.js';
import type { AstNode, Expression, LoweredInstruction, LoweredProgram, Program, ScalarType, SemanticModel, Statement, TypedSlot } from './model.js';
type Body=LoweredInstruction extends infer I?I extends LoweredInstruction?Omit<I,'id'|'span'|'astId'|'visibleSymbolIds'>:never:never;
export class Lowerer {
 private slots:TypedSlot[];private instructions:LoweredInstruction[]=[];private labels=new Map<string,number>();private labelCount=0;private loopBack=new Set<string>();private visible:string[]=[];
 constructor(private readonly semantic:SemanticModel,private readonly guard:BudgetGuard){this.slots=semantic.symbols.map(s=>({id:s.slotId,type:s.type,symbolId:s.id,displayName:s.name,temporary:false}));}
 private label(){return `label-${this.labelCount++}`;}
 private mark(label:string){this.labels.set(label,this.instructions.length);}
 private slot(type:ScalarType){this.guard.checkCount('maxSlots',this.slots.length+1,'LIMIT_SLOTS','lower');const id=`slot-${this.slots.length}`;this.slots.push({id,type,displayName:`t${this.slots.length}`,temporary:true});return id;}
 private emit(node:AstNode,body:Body){this.guard.checkpoint('lower');this.guard.checkCount('maxCfgNodes',this.instructions.length+1,'LIMIT_CFG','lower');const instruction={id:`ir-${this.instructions.length}`,span:node.span,astId:node.id,visibleSymbolIds:[...this.visible],...body} as LoweredInstruction;this.instructions.push(instruction);return instruction.id;}
 private user(node:AstNode){const id=this.semantic.resolvedUses[node.id];const symbol=this.semantic.symbols.find(s=>s.id===id);if(!symbol)throw new Error('Missing resolved symbol.');return symbol.slotId;}
 private expression(root:Expression):string{
  const results=new Map<string,string>();const tasks:(()=>void)[]=[];
  const schedule=(node:Expression)=>{
   tasks.push(()=>{
    this.guard.checkpoint('lower');
    if(node.kind==='Variable'){results.set(node.id,this.user(node));return;}
    if(node.kind==='Literal'){const dst=this.slot(node.scalar.type);this.emit(node,{op:'const',dst,scalar:node.scalar});results.set(node.id,dst);return;}
    if(node.kind==='Binary'&&(node.op==='&&'||node.op==='||')){
     const dst=this.slot('bool'),right=this.label(),fixed=this.label(),merge=this.label(),and=node.op==='&&';results.set(node.id,dst);
     tasks.push(()=>this.mark(merge));
     tasks.push(()=>this.emit(node,{op:'jump',target:merge}));
     tasks.push(()=>this.emit(node,{op:'copy',dst,src:results.get(node.right.id)!}));
     schedule(node.right);tasks.push(()=>this.mark(right));
     tasks.push(()=>this.emit(node,{op:'jump',target:merge}));
     tasks.push(()=>this.emit(node,{op:'const',dst,scalar:{type:'bool',value:!and}}));tasks.push(()=>this.mark(fixed));
     tasks.push(()=>this.emit(node,{op:'branch',conditionSlot:results.get(node.left.id)!,trueTarget:and?right:fixed,falseTarget:and?fixed:right}));schedule(node.left);return;
    }
    const destination=()=>{const dst=this.slot(this.semantic.expressionTypes[node.id]!);results.set(node.id,dst);return dst;};
    if(node.kind==='Unary'){tasks.push(()=>this.emit(node,{op:'unary',dst:destination(),operator:node.op,src:results.get(node.operand.id)!}));schedule(node.operand);}
    else if(node.kind==='InputCall'){const source=this.semantic.inputSources.find(s=>s.astId===node.id)!;tasks.push(()=>this.emit(node,{op:'input',dst:destination(),promptSlot:results.get(node.prompt.id)!,sourceId:source.id}));schedule(node.prompt);}
    else {const operator=node.op as Extract<LoweredInstruction,{op:'binary'}>['operator'];tasks.push(()=>this.emit(node,{op:'binary',dst:destination(),operator,left:results.get(node.left.id)!,right:results.get(node.right.id)!}));schedule(node.right);schedule(node.left);}
   });
  };
  schedule(root);while(tasks.length)tasks.pop()!();return results.get(root.id)!;
 }
 private statement(node:Statement):void{
  switch(node.kind){
   case 'Block':{const saved=[...this.visible];node.statements.forEach(s=>this.statement(s));this.visible=saved;break;}
   case 'Declaration':{const src=this.expression(node.initializer);this.visible.push(this.semantic.resolvedUses[node.id]!);this.emit(node,{op:'copy',dst:this.user(node),src});break;}
   case 'Assignment':this.emit(node,{op:'copy',dst:this.user(node),src:this.expression(node.value)});break;
   case 'EffectCall':{const argSlots=node.args.map(arg=>this.expression(arg));this.emit(node,{op:'effect',effectName:node.name,argSlots,effectAstId:node.id});break;}
   case 'If':{const conditionSlot=this.expression(node.condition),yes=this.label(),no=this.label(),join=this.label();this.emit(node,{op:'branch',conditionSlot,trueTarget:yes,falseTarget:no});this.mark(yes);this.statement(node.then);this.emit(node,{op:'jump',target:join});this.mark(no);if(node.optionalElse)this.statement(node.optionalElse);this.emit(node,{op:'jump',target:join});this.mark(join);break;}
   case 'While':{const test=this.label(),body=this.label(),exit=this.label();this.mark(test);const conditionSlot=this.expression(node.condition);this.emit(node,{op:'branch',conditionSlot,trueTarget:body,falseTarget:exit});this.mark(body);this.statement(node.body);this.loopBack.add(this.emit(node,{op:'jump',target:test}));this.mark(exit);break;}
  }
 }
 lower(program:Program):LoweredProgram{
  this.guard.checkpoint('lower',true);const error=this.semantic.diagnostics.find(d=>d.blocking);if(error)throw new SourceFailure(error);
  program.statements.forEach(s=>this.statement(s));this.emit(program,{op:'halt'});
  const resolve=(target:string)=>{const index=this.labels.get(target);if(index===undefined)throw new Error('Unresolved label.');return `ir-${index}`;};
  for(const i of this.instructions){if(i.op==='branch'){i.trueTarget=resolve(i.trueTarget);i.falseTarget=resolve(i.falseTarget);}else if(i.op==='jump')i.target=resolve(i.target);}
  const lowered:LoweredProgram={slots:this.slots,instructions:this.instructions,edges:deriveEdges(this.instructions,this.loopBack),entryNodeId:this.instructions[0]!.id,exitNodeId:this.instructions.at(-1)!.id,sourceMap:Object.fromEntries(this.instructions.map(i=>[i.id,i.span]))};
  validateLoweredProgram(lowered,program,this.semantic,this.guard);this.guard.checkpoint('lower',true);return lowered;
 }
}
export function lowerProgram(program:Program,semantic:SemanticModel,guard:BudgetGuard):LoweredProgram{return new Lowerer(semantic,guard).lower(program);}
