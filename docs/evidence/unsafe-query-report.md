# FlowGuard report

Outcome: completed. 
Analyzer 0.1.0; language 1; schema 1.
Snapshot: snapshot-0-086b87a8dcb21b3c148decac0c6b66fb90aa9dddd8a81a099572a0d25e6dfd06; revision 0.
SHA-256: 086b87a8dcb21b3c148decac0c6b66fb90aa9dddd8a81a099572a0d25e6dfd06

## Source
```fg
let name: string = input("Name");
let query: string = "SELECT * FROM users WHERE name = " + name;
sql_query(query);

```
## Diagnostics
```
None.
```
## Possible-flow findings
```
SQL_QUERY_TEXT at 3:1; sources: src-0; explanation complete: true
```
## Limitations
- Structural paths are overapproximated; a finding does not prove a feasible attack.
- Explicit data flow only; implicit control flow is not tracked.
- SQL and shell sinks are educational models.
## Compiler summary
Completed stages: validate, lex, parse, semantic, lower, taint, findings, codegen, verify.
Tokens: 25; AST nodes: 10; slots: 6; CFG nodes: 8; source identities: src-0.
## Bytecode
```
00000  PUSH_CONST 0  ; ir-0 1:26
00001  STORE 2  ; ir-0 1:26
00002  LOAD 2  ; ir-1 1:20
00003  INPUT 0  ; ir-1 1:20
00004  STORE 3  ; ir-1 1:20
00005  LOAD 3  ; ir-2 1:1
00006  STORE 0  ; ir-2 1:1
00007  PUSH_CONST 1  ; ir-3 2:21
00008  STORE 4  ; ir-3 2:21
00009  LOAD 4  ; ir-4 2:21
00010  LOAD 0  ; ir-4 2:21
00011  CONCAT_STRING  ; ir-4 2:21
00012  STORE 5  ; ir-4 2:21
00013  LOAD 5  ; ir-5 2:1
00014  STORE 1  ; ir-5 2:1
00015  LOAD 1  ; ir-6 3:1
00016  SQL_QUERY  ; ir-6 3:1
00017  HALT  ; ir-7 1:1
```
## Simulated execution
```json
{
  "schemaVersion": 1,
  "requestId": "run-unsafe-query",
  "snapshotId": "snapshot-0-086b87a8dcb21b3c148decac0c6b66fb90aa9dddd8a81a099572a0d25e6dfd06",
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
        "start": 98,
        "end": 115,
        "startLine": 3,
        "startColumn": 1,
        "endLine": 3,
        "endColumn": 18
      },
      "pc": 16,
      "kind": "sql-query",
      "query": "SELECT * FROM users WHERE name = Ada",
      "simulated": true
    }
  ],
  "consumedInputCount": 1,
  "instructionCount": 18,
  "elapsedMs": 0.9195840000000146,
  "finalTopLevelValues": [
    {
      "symbolId": "sym-0",
      "name": "name",
      "value": {
        "type": "string",
        "value": "Ada"
      }
    },
    {
      "symbolId": "sym-1",
      "name": "query",
      "value": {
        "type": "string",
        "value": "SELECT * FROM users WHERE name = Ada"
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
    "sourceUtf8Bytes": 116,
    "tokenCount": 25,
    "astCount": 10,
    "slotCount": 6,
    "cfgNodeCount": 8,
    "inputSourceCount": 1,
    "processedNodeCount": 8,
    "updateCount": 8,
    "bytecodeCount": 18,
    "stageDurationsMs": {
      "validate": 0.005500000000012051,
      "lex": 0.038207999999997355,
      "parse": 0.024249999999994998,
      "semantic": 0.026416000000011763,
      "lower": 0.053374999999988404,
      "taint": 0.4747499999999718,
      "findings": 0.031125000000002956,
      "codegen": 0.2442920000000015,
      "verify": 0.17016699999999219
    },
    "totalDurationMs": 1.1480419999999754
  }
}
```
