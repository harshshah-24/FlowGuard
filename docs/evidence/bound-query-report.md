# FlowGuard report

Outcome: completed. 
Analyzer 0.1.0; language 1; schema 1.
Snapshot: snapshot-0-96ec36aa315bda7baedb8e86b4bc7750979f5392f7a2bb44dae1e2bc8da38213; revision 0.
SHA-256: 96ec36aa315bda7baedb8e86b4bc7750979f5392f7a2bb44dae1e2bc8da38213

## Source
```fg
let name: string = input("Name");
sql_bind("SELECT * FROM users WHERE name = ?", name);

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
Tokens: 18; AST nodes: 7; slots: 4; CFG nodes: 6; source identities: src-0.
## Bytecode
```
00000  PUSH_CONST 0  ; ir-0 1:26
00001  STORE 1  ; ir-0 1:26
00002  LOAD 1  ; ir-1 1:20
00003  INPUT 0  ; ir-1 1:20
00004  STORE 2  ; ir-1 1:20
00005  LOAD 2  ; ir-2 1:1
00006  STORE 0  ; ir-2 1:1
00007  PUSH_CONST 1  ; ir-3 2:10
00008  STORE 3  ; ir-3 2:10
00009  LOAD 3  ; ir-4 2:1
00010  LOAD 0  ; ir-4 2:1
00011  SQL_BIND  ; ir-4 2:1
00012  HALT  ; ir-5 1:1
```
## Simulated execution
```json
{
  "schemaVersion": 1,
  "requestId": "run-bound-query",
  "snapshotId": "snapshot-0-96ec36aa315bda7baedb8e86b4bc7750979f5392f7a2bb44dae1e2bc8da38213",
  "revision": 0,
  "status": "completed",
  "diagnostics": [],
  "events": [
    {
      "index": 0,
      "span": {
        "start": 19,
        "end": 32,
        "startLine": 1,
        "startColumn": 20,
        "endLine": 1,
        "endColumn": 33
      },
      "pc": 3,
      "kind": "input",
      "sourceId": "src-0",
      "prompt": "Name",
      "value": "Ada"
    },
    {
      "index": 1,
      "span": {
        "start": 34,
        "end": 87,
        "startLine": 2,
        "startColumn": 1,
        "endLine": 2,
        "endColumn": 54
      },
      "pc": 11,
      "kind": "sql-bind",
      "template": "SELECT * FROM users WHERE name = ?",
      "value": {
        "type": "string",
        "value": "Ada"
      },
      "simulated": true
    }
  ],
  "consumedInputCount": 1,
  "instructionCount": 13,
  "elapsedMs": 0.31862499999999727,
  "finalTopLevelValues": [
    {
      "symbolId": "sym-0",
      "name": "name",
      "value": {
        "type": "string",
        "value": "Ada"
      }
    }
  ],
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
    "sourceUtf8Bytes": 88,
    "tokenCount": 18,
    "astCount": 7,
    "slotCount": 4,
    "cfgNodeCount": 6,
    "inputSourceCount": 1,
    "processedNodeCount": 6,
    "updateCount": 6,
    "bytecodeCount": 13,
    "stageDurationsMs": {
      "validate": 0.00333299999999781,
      "lex": 0.023041000000006306,
      "parse": 0.03412500000001728,
      "semantic": 0.019875000000013188,
      "lower": 0.04779200000001538,
      "taint": 0.2762920000000122,
      "findings": 0.007082999999994399,
      "codegen": 0.15874999999999773,
      "verify": 0.1495830000000069
    },
    "totalDurationMs": 0.7464590000000157
  }
}
```
