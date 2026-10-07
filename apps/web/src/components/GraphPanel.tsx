import { ReactFlow, Background, Controls } from '@xyflow/react';
import { useCallback, useRef } from 'react';
import '@xyflow/react/dist/style.css';
import type { LoweredProgram } from '@flowguard/core';
import { GraphNode, type InstructionNode } from './GraphNode.js';
import { GraphList } from './GraphList.js';
const nodeTypes={instruction:GraphNode};
export function GraphPanel({program,positions,status,selected,onSelect,partial=false}:{program:LoweredProgram;positions:Record<string,{x:number;y:number}>;status:string;selected:string|null;onSelect:(id:string)=>void;partial?:boolean}){
 const selection=useRef({selected,onSelect});selection.current={selected,onSelect};
 const onSelectionChange=useCallback((change:{nodes:{id:string}[]})=>{const node=change.nodes[0];if(node&&node.id!==selection.current.selected)selection.current.onSelect(node.id);},[]);
 const nodes:InstructionNode[]=program.instructions.map(n=>{const slot='dst' in n?n.dst:n.op==='effect'?n.argSlots.join(','):n.op==='branch'?n.conditionSlot:'';return {id:n.id,type:'instruction',position:positions[n.id]??{x:0,y:0},selected:n.id===selected,data:{label:`${n.id} · ${n.op==='effect'?n.effectName:n.op}`,detail:`${n.span.startLine}:${n.span.startColumn} · ${n.op==='input'?n.sourceId:slot}`,role:n.op==='input'?'Input':n.op==='effect'?(n.effectName==='print'?'Output':'Sink'):program.edges.some(e=>e.to===n.id&&e.kind==='loop-back')?'Loop':program.edges.filter(e=>e.to===n.id).length>1?'Merge':''}};});
 return <><h2>Control flow {partial?'· Partial artifact':''}</h2>{status==='ready'&&program.instructions.length<=200?<div className="flow-canvas" aria-label="Control-flow graph"><ReactFlow nodes={nodes} edges={program.edges.map(e=>({id:e.id,source:e.from,target:e.to,label:e.kind,animated:false}))} nodeTypes={nodeTypes} nodesDraggable={false} nodesConnectable={false} elementsSelectable fitView onNodeClick={(_,node)=>onSelect(node.id)} onSelectionChange={onSelectionChange}><Background/><Controls showInteractive={false}/></ReactFlow></div>:<><p className="panel-note">{status==='running'?'Layout is running; list remains available.':'Searchable graph list.'}</p><GraphList program={program} selected={selected} onSelect={onSelect}/></>}</>;
}
