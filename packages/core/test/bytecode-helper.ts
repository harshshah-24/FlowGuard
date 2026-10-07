import { emptyAnalysis } from './fixtures.js';
import type { BytecodeArtifact,BytecodeInstruction,Scalar } from '../src/model.js';
export function artifact(code:BytecodeInstruction[],constants:Scalar[]=[]):BytecodeArtifact {
 const b=emptyAnalysis().artifacts.bytecode!;return {...b,constants,instructions:code,sourceMap:code.map((_,pc)=>({...b.sourceMap[0]!,pc})),slots:[{id:'slot-0',type:'int',displayName:'x',temporary:true}]};
}
