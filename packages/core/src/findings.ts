import type { Finding, LoweredProgram, SemanticModel, TaintResult } from './model.js';
export function collectFindings(program:LoweredProgram,states:TaintResult,_semantic:SemanticModel):Finding[] {
 const findings:Finding[]=[];
 for(const node of program.instructions){if(node.op!=='effect'||node.effectName==='print')continue;
  const state=states.states[node.id]?.in;if(!state?.reachable)continue;
  const sourceIds=state.entries.find(e=>e.slotId===node.argSlots[0])?.sourceIds??[];if(!sourceIds.length)continue;
  const rule=node.effectName==='shell'?'SHELL_COMMAND_TEXT':'SQL_QUERY_TEXT';
  findings.push({id:`${rule}:${node.effectAstId}:0`,rule,sinkNodeId:node.id,effectAstId:node.effectAstId,argIndex:0,span:node.span,sourceIds:[...sourceIds],explanationFactIds:[],explanationComplete:false});
 }
 return findings.sort((a,b)=>a.span.start-b.span.start||a.rule.localeCompare(b.rule)||a.argIndex-b.argIndex);
}
