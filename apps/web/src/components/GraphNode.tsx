import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
export type InstructionNode=Node<{label:string;detail:string;role:string},'instruction'>;
export function GraphNode({data,selected}:NodeProps<InstructionNode>){return <div data-role={data.role} className={`instruction-node ${selected?'selected':''}`}><Handle type="target" position={Position.Top}/><strong>{data.role} {data.label}</strong><small>{data.detail}</small><Handle type="source" position={Position.Bottom}/></div>;}
