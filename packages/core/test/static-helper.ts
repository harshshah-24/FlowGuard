import { lowered,guard } from './frontend-helper.js';
import { solveTaint } from '../src/taint.js';
import { collectFindings } from '../src/findings.js';
export function staticAnalysis(source:string){const front=lowered(source),taint=solveTaint(front.lowered,guard());return {...front,taint,findings:collectFindings(front.lowered,taint,front.semantic)};}
