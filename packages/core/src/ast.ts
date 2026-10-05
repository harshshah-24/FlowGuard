import type { AstNode } from './model.js';
export function children(node:AstNode):AstNode[]{
 switch(node.kind){
  case 'Program':case 'Block':return node.statements;
  case 'Declaration':return [node.initializer];
  case 'Assignment':return [node.value];
  case 'If':return [node.condition,node.then,...(node.optionalElse?[node.optionalElse]:[])];
  case 'While':return [node.condition,node.body];
  case 'EffectCall':return node.args;
  case 'Unary':return [node.operand];
  case 'Binary':return [node.left,node.right];
  case 'InputCall':return [node.prompt];
  default:return [];
 }
}
export function preorder(root:AstNode):AstNode[]{
 const nodes:AstNode[]=[],stack=[root];while(stack.length){const node=stack.pop()!;nodes.push(node);const next=children(node);for(let i=next.length-1;i>=0;i--)stack.push(next[i]!);}return nodes;
}
