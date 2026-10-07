import dagre from '@dagrejs/dagre';
import { LayoutRequestSchema } from '@flowguard/core';
const scope=self as unknown as {onmessage:((event:MessageEvent)=>void)|null;postMessage:(value:unknown)=>void};
scope.onmessage=event=>{const r=LayoutRequestSchema.parse(event.data);const graph=new dagre.graphlib.Graph({multigraph:true}).setGraph({rankdir:'TB',ranksep:70,nodesep:30}).setDefaultEdgeLabel(()=>({}));
 for(const node of r.program.instructions)graph.setNode(node.id,{width:180,height:64});
 for(const edge of r.program.edges)graph.setEdge(edge.from,edge.to,{},edge.id);
 dagre.layout(graph);const positions:Record<string,{x:number;y:number}>={};
 for(const id of graph.nodes()){const point=graph.node(id);positions[id]={x:point.x-90,y:point.y-32};}
 scope.postMessage({type:'layout-result',protocolVersion:1,requestId:r.requestId,snapshotId:r.snapshotId,positions});
};
