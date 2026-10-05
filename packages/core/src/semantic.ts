import { preorder } from './ast.js';
import { makeDiagnostic, type DiagnosticCode } from './diagnostics.js';
import type { BudgetGuard } from './limits.js';
import type { Expression, Program, ScalarType, Scope, SemanticModel, SourceSnapshot, SourceSpan, Statement, Symbol } from './model.js';
class DiagnosticCap extends Error {}
export class SemanticChecker {
 private readonly model:SemanticModel={symbols:[],scopes:[],expressionTypes:{},resolvedUses:{},inputSources:[],diagnostics:[]};
 private readonly stack:{scope:Scope;names:Map<string,Symbol>}[]=[];
 constructor(private readonly guard:BudgetGuard){}
 private error(code:DiagnosticCode,message:string,span:SourceSpan){
  if(this.model.diagnostics.length===100){this.model.diagnostics.push(makeDiagnostic('TOO_MANY_DIAGNOSTICS','semantic','Semantic diagnostic limit reached.'));throw new DiagnosticCap();}
  this.model.diagnostics.push(makeDiagnostic(code,'semantic',message,span));
 }
 private lookup(name:string){for(let i=this.stack.length-1;i>=0;i--){const symbol=this.stack[i]!.names.get(name);if(symbol)return symbol;}return undefined;}
 private scope(span:SourceSpan,fn:()=>void){const parent=this.stack.at(-1)?.scope;const scope:Scope={id:`scope-${this.model.scopes.length}`,span,symbolIds:[],...(parent?{parentId:parent.id}:{})};this.model.scopes.push(scope);this.stack.push({scope,names:new Map()});try{fn();}finally{this.stack.pop();}}
 private expression(root:Expression):ScalarType|undefined{
  const todo:{node:Expression;visited:boolean}[]=[{node:root,visited:false}];
  while(todo.length){this.guard.checkpoint('semantic');const {node,visited}=todo.pop()!;
   if(!visited){todo.push({node,visited:true});const children=node.kind==='Binary'?[node.left,node.right]:node.kind==='Unary'?[node.operand]:node.kind==='InputCall'?[node.prompt]:[];for(let i=children.length-1;i>=0;i--)todo.push({node:children[i]!,visited:false});continue;}
   const types=this.model.expressionTypes;let type:ScalarType|undefined;
   switch(node.kind){
    case 'Literal':type=node.scalar.type;break;
    case 'Variable':{const symbol=this.lookup(node.name);if(!symbol)this.error('SEM_UNDECLARED',`Variable ${node.name} is not declared in this scope.`,node.span);else{type=symbol.type;this.model.resolvedUses[node.id]=symbol.id;}break;}
    case 'InputCall':if(types[node.prompt.id]&&types[node.prompt.id]!=='string')this.error('SEM_TYPE','input prompt must be a string.',node.prompt.span);type='string';break;
    case 'Unary':{const expected=node.op==='!'?'bool':'int';if(types[node.operand.id]&&types[node.operand.id]!==expected)this.error('SEM_TYPE',`${node.op} requires ${expected}.`,node.span);if(types[node.operand.id]===expected)type=expected;break;}
    case 'Binary':{
     const left=types[node.left.id],right=types[node.right.id];if(!left||!right)break;
     if(node.op==='&&'||node.op==='||'){if(left==='bool'&&right==='bool')type='bool';}
     else if(node.op==='=='||node.op==='!='){if(left===right)type='bool';}
     else if(['<','<=','>','>='].includes(node.op)){if(left==='int'&&right==='int')type='bool';}
     else if(node.op==='+'){if(left===right&&(left==='int'||left==='string'))type=left;}
     else if(left==='int'&&right==='int')type='int';
     if(!type)this.error('SEM_TYPE',`Operator ${node.op} does not accept ${left} and ${right}.`,node.span);break;
    }
   }
   if(type)types[node.id]=type;
  }
  return this.model.expressionTypes[root.id];
 }
 private statement(node:Statement):void{
  this.guard.checkpoint('semantic');
  switch(node.kind){
   case 'Block':this.scope(node.span,()=>node.statements.forEach(s=>this.statement(s)));break;
   case 'Declaration':{
    const type=this.expression(node.initializer),visible=this.lookup(node.name),current=this.stack.at(-1)!;
    if(visible)this.error(current.names.has(node.name)?'SEM_DUPLICATE':'SEM_SHADOWING',`Name ${node.name} is already visible.`,node.nameSpan);
    if(type&&type!==node.type)this.error('SEM_TYPE',`Initializer must have type ${node.type}.`,node.initializer.span);
    if(!visible){this.guard.checkCount('maxSlots',this.model.symbols.length+1,'LIMIT_SLOTS','semantic');const symbol:Symbol={id:`sym-${this.model.symbols.length}`,slotId:`slot-${this.model.symbols.length}`,name:node.name,type:node.type,declarationSpan:node.nameSpan,scopeId:current.scope.id,topLevel:this.stack.length===1};this.model.symbols.push(symbol);current.names.set(node.name,symbol);current.scope.symbolIds.push(symbol.id);this.model.resolvedUses[node.id]=symbol.id;}break;
   }
   case 'Assignment':{const symbol=this.lookup(node.target),type=this.expression(node.value);if(!symbol)this.error('SEM_UNDECLARED',`Variable ${node.target} is not declared in this scope.`,node.targetSpan);else{this.model.resolvedUses[node.id]=symbol.id;if(type&&type!==symbol.type)this.error('SEM_TYPE',`Assignment must have type ${symbol.type}.`,node.value.span);}break;}
   case 'If':{const type=this.expression(node.condition);if(type&&type!=='bool')this.error('SEM_TYPE','if condition must be bool.',node.condition.span);this.statement(node.then);if(node.optionalElse)this.statement(node.optionalElse);break;}
   case 'While':{const type=this.expression(node.condition);if(type&&type!=='bool')this.error('SEM_TYPE','while condition must be bool.',node.condition.span);this.statement(node.body);break;}
   case 'EffectCall':{
    const types=node.args.map(arg=>this.expression(arg)),expected=node.name==='sql_bind'?2:1;
    if(node.args.length!==expected)this.error('SEM_ARGUMENTS',`${node.name} expects ${expected} argument(s).`,node.span);
    if(node.name!=='print'&&types[0]&&types[0]!=='string')this.error('SEM_TYPE',`${node.name} argument 1 must be string.`,node.args[0]!.span);
    if(node.name==='sql_bind'&&node.args[0]){const template=node.args[0];if(template.kind==='Literal'&&template.scalar.type==='string'){if([...template.scalar.value].filter(c=>c==='?').length!==1)this.error('SEM_TEMPLATE_PLACEHOLDERS','Literal sql_bind template must contain exactly one ?.',template.span);}else this.error('TEMPLATE_UNVERIFIED','Nonliteral sql_bind template placeholder count is not verified.',template.span);}break;
   }
  }
 }
 check(program:Program):SemanticModel{
  this.guard.checkpoint('semantic',true);
  const sources=preorder(program).filter((node):node is Extract<Expression,{kind:'InputCall'}>=>node.kind==='InputCall').sort((a,b)=>a.span.start-b.span.start);
  this.guard.checkCount('maxInputSources',sources.length,'LIMIT_SOURCES','semantic');
  this.model.inputSources=sources.map((node,i)=>({id:`src-${i}`,astId:node.id,span:node.span,label:`input at ${node.span.startLine}:${node.span.startColumn}`}));
  try{this.scope(program.span,()=>program.statements.forEach(node=>this.statement(node)));}catch(error){if(!(error instanceof DiagnosticCap))throw error;}
  this.guard.checkpoint('semantic',true);return this.model;
 }
}
export function checkSemantics(program:Program,_snapshot:SourceSnapshot,guard:BudgetGuard):SemanticModel{return new SemanticChecker(guard).check(program);}
