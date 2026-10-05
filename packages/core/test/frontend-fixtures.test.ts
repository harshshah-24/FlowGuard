import { it,expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SourceFailure } from '../src/diagnostics.js';
import { lowerProgram } from '../src/lower.js';
import { front,guard } from './frontend-helper.js';
const manifest=JSON.parse(readFileSync(resolve('fixtures/manifest.json'),'utf8')) as {fixtures:{id:string;filename:string;expectedDiagnosticCodes:string[]}[]};
for(const fixture of manifest.fixtures)it(`independent frontend fixture: ${fixture.id}`,()=>{const source=readFileSync(resolve('fixtures',fixture.filename),'utf8');try{const result=front(source);expect(result.semantic.diagnostics.map(d=>d.code)).toEqual(fixture.expectedDiagnosticCodes);if(!result.semantic.diagnostics.some(d=>d.blocking))expect(lowerProgram(result.ast,result.semantic,guard()).instructions.at(-1)?.op).toBe('halt');}catch(error){if(!(error instanceof SourceFailure))throw error;expect([error.diagnostic.code]).toEqual(fixture.expectedDiagnosticCodes);}});
