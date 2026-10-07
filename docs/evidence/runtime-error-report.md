# FlowGuard report

Outcome: completed. 
Analyzer 0.1.0; language 1; schema 1.
Snapshot: snapshot-0-0cc299a24ce940ddfbc5ed5dc18c7e1b5bedc8ebe19996f45efc20539fbda3c4; revision 0.
SHA-256: 0cc299a24ce940ddfbc5ed5dc18c7e1b5bedc8ebe19996f45efc20539fbda3c4

## Source
```fg
let n: int = 1 / 0;
print(n);

```
## Diagnostics
```
None.
```
## Possible-flow findings
```
No modeled explicit flow findings.
```
## Limitations
- Structural paths are overapproximated; a finding does not prove a feasible attack.
- Explicit data flow only; implicit control flow is not tracked.
- SQL and shell sinks are educational models.
## Compiler summary
Completed stages: validate, lex, parse, semantic, lower, taint, findings, codegen, verify.
Tokens: 15; AST nodes: 7; slots: 4; CFG nodes: 6; source identities: none.
## Bytecode
```
00000  PUSH_CONST 0  ; ir-0 1:14
00001  STORE 1  ; ir-0 1:14
00002  PUSH_CONST 1  ; ir-1 1:18
00003  STORE 2  ; ir-1 1:18
00004  LOAD 1  ; ir-2 1:14
00005  LOAD 2  ; ir-2 1:14
00006  DIV_INT  ; ir-2 1:14
00007  STORE 3  ; ir-2 1:14
00008  LOAD 3  ; ir-3 1:1
00009  STORE 0  ; ir-3 1:1
00010  LOAD 0  ; ir-4 2:1
00011  PRINT  ; ir-4 2:1
00012  HALT  ; ir-5 1:1
```
## Simulated execution
```json
{
  "schemaVersion": 1,
  "requestId": "run-runtime-error",
  "snapshotId": "snapshot-0-0cc299a24ce940ddfbc5ed5dc18c7e1b5bedc8ebe19996f45efc20539fbda3c4",
  "revision": 0,
  "status": "runtime-error",
  "diagnostics": [
    {
      "code": "RUNTIME_DIV_ZERO",
      "stage": "runtime",
      "severity": "error",
      "message": "Division or remainder by zero.",
      "blocking": true,
      "span": {
        "start": 13,
        "end": 18,
        "startLine": 1,
        "startColumn": 14,
        "endLine": 1,
        "endColumn": 19
      }
    }
  ],
  "events": [],
  "consumedInputCount": 0,
  "instructionCount": 7,
  "elapsedMs": 0.2842909999999961,
  "finalTopLevelValues": [],
  "limits": {
    "maxSourceBytes": 262144,
    "maxNesting": 128,
    "maxTokens": 65536,
    "maxAstNodes": 20000,
    "maxSlots": 4000,
    "maxCfgNodes": 2000,
    "maxInputSources": 256,
    "maxBytecodeInstructions": 50000,
    "maxSolverVisits": 200000,
    "maxVerifierVisits": 200000,
    "maxStateCells": 4000000,
    "maxSourceMemberships": 2000000,
    "analysisDeadlineMs": 10000,
    "maxReplayEvents": 10000,
    "replayCheckpointInterval": 100,
    "maxReplayBytes": 8388608,
    "maxProvenanceFacts": 20000,
    "maxExplanationFacts": 200,
    "maxReportBytes": 16777216,
    "maxInteractiveGraphNodes": 200,
    "maxVmInstructions": 100000,
    "executionDeadlineMs": 1000,
    "maxVmStack": 1024,
    "maxStringBytes": 65536,
    "maxVmStorageBytes": 4194304,
    "maxVmEvents": 1000,
    "maxVmOutputBytes": 1048576,
    "maxInputItems": 1000,
    "maxInputBytes": 1048576
  }
}
```
## Limits and statistics
```json
{
  "limits": {
    "maxSourceBytes": 262144,
    "maxNesting": 128,
    "maxTokens": 65536,
    "maxAstNodes": 20000,
    "maxSlots": 4000,
    "maxCfgNodes": 2000,
    "maxInputSources": 256,
    "maxBytecodeInstructions": 50000,
    "maxSolverVisits": 200000,
    "maxVerifierVisits": 200000,
    "maxStateCells": 4000000,
    "maxSourceMemberships": 2000000,
    "analysisDeadlineMs": 10000,
    "maxReplayEvents": 10000,
    "replayCheckpointInterval": 100,
    "maxReplayBytes": 8388608,
    "maxProvenanceFacts": 20000,
    "maxExplanationFacts": 200,
    "maxReportBytes": 16777216,
    "maxInteractiveGraphNodes": 200,
    "maxVmInstructions": 100000,
    "executionDeadlineMs": 1000,
    "maxVmStack": 1024,
    "maxStringBytes": 65536,
    "maxVmStorageBytes": 4194304,
    "maxVmEvents": 1000,
    "maxVmOutputBytes": 1048576,
    "maxInputItems": 1000,
    "maxInputBytes": 1048576
  },
  "statistics": {
    "sourceUtf8Bytes": 30,
    "tokenCount": 15,
    "astCount": 7,
    "slotCount": 4,
    "cfgNodeCount": 6,
    "inputSourceCount": 0,
    "processedNodeCount": 6,
    "updateCount": 6,
    "bytecodeCount": 13,
    "stageDurationsMs": {
      "validate": 0.0029159999999990305,
      "lex": 0.01941600000000676,
      "parse": 0.02225000000001387,
      "semantic": 0.01733400000000529,
      "lower": 0.04291700000001697,
      "taint": 0.26641599999999244,
      "findings": 0.005124999999992497,
      "codegen": 0.18029100000001108,
      "verify": 0.15087500000001342
    },
    "totalDurationMs": 0.7462080000000242
  }
}
```
