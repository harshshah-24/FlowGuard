# FlowGuard — Detailed Implementation Plan

**Version:** 1.3 — approved Phase 3 scope metadata amendment

**Date:** 2026-10-05

**Product source of truth:** [PRD v0.3](flowguard_prd.md)

**Team:** two; deadline: 8 October 2026 (submission time unspecified).

**Phase 1 dependency amendment (5 October 2026):** The user approved retaining Monaco 0.57.0 with an exact root npm override `monaco-editor → dompurify: 3.4.16`, replacing its vulnerable 3.4.15 dependency. Update the lockfile and verify production editor/worker behavior.

**Approval status:** Phases 0/1 are published on main and remote CI passed. On 7 October the user authorized Phase 2, then explicitly requested "go ahead and implement phase 3 as well", and approved the scope amendment below with "go ahead". Phases 2/3 are complete locally. The user then authorized pushing all completed work for teammate continuation. This publication fast-forwards canonical main from `f4c0aa9` and authorizes the teammate to continue Phase 4. Phase 4 remains unstarted; use phase_4_agent_handoff.md. Publication of later Phase 4 work needs the applicable authorization.

**Approved Phase 3 contract amendment (7 October):** Bytecode now includes required `topLevelSymbolIds` in symbol order, derived from the final lowered HALT's `visibleSymbolIds`. The schema/verifier rejects missing, duplicate, unordered or unknown identities and references to temporary slots. VM results project initialized values at successful or failed termination, omitting block locals, temporaries and declarations not reached. This supplies the metadata required by section 9 without changing language behavior, bytecode opcodes or resource limits.

## 1. Outcome and Fixed Scope

Build one local educational compiler/analyzer with a browser interface and CLI. Implement the language in PRD section 6 exactly, generate a typed control-flow representation, compute explicit may-taint, generate/verify stack bytecode, and optionally run that bytecode in a bounded VM. SQL and shell effects are simulated logs only.

The approved stack is TypeScript, Node.js, React/Vite, browser workers, our own lexer/parser, Monaco, React Flow, Dagre, Zod, Vitest, and Playwright. No application backend, database, account, autosave, history, native code generation, real external effects, or project license is added.

Preserve root `README.md`, `.gitignore`, and `context/`. All source/examples/tests must be synthetic and contain no credentials/private inputs. All repository work targets `harshshah-24/FlowGuard` only. Develop on a `codex/flowguard-build` branch after implementation approval; pushing/merging requires the authorization applicable at that time, not this plan draft.

If implementation cannot follow an exact rule here or a PRD requirement, stop and ask. Do not silently substitute libraries, remove VM/codegen, relax budgets, or call a partial build complete.

## 2. Runtime, Versions, and Dependency Configuration

Use ESM throughout. Pin Node.js `26.5.0` in `.nvmrc` and npm `11.17.0` in root `packageManager`. Root engines: Node `>=26.5.0 <27`, npm `>=11.17.0 <12`. These match the local environment inspected during planning. Exact npm dependency versions below were verified from registry metadata; none was installed or compatibility-tested during drafting.

Runtime/package dependencies:

- `packages/core`: `zod` 4.6.5.
- `packages/cli`: local `@flowguard/core` 0.1.0, no separate CLI framework.
- `apps/web`: local `@flowguard/core` 0.1.0; `react`/`react-dom` 19.3.0; `monaco-editor` 0.57.0; `@xyflow/react` 12.12.0; `@dagrejs/dagre` 3.1.1.
- Root dev dependencies: `typescript` 7.0.2; `vite` 8.3.2; `@vitejs/plugin-react` 6.1.1; `vitest` 5.0.3; `@playwright/test` 1.63.0; `@types/node` 26.6.4; `@types/react`/`@types/react-dom` 19.3.0.

Dagre contains its own types; do not add obsolete `@types/dagre`. Optional unrelated Vite peers (Sass, Babel compiler, etc.) are not needed. If npm reports a genuine required-peer/version conflict, stop and report it before changing pins. Use exact direct versions and commit root `package-lock.json`; use `npm ci` thereafter. Root/workspaces are private; no npm package publication.

TypeScript shared configuration: target ES2022; strict; noUncheckedIndexedAccess; exactOptionalPropertyTypes; useUnknownInCatchVariables; forceConsistentCasing; skipLibCheck; noImplicitOverride. Core/CLI use NodeNext module/resolution, `.js` specifiers in TS imports, declaration output, and no DOM library. Web uses ESNext/Bundler resolution, ES2022 plus DOM libraries, React JSX, and noEmit. Core runtime imports must not use Node globals or browser APIs; pass clocks/abort checkpoints as functions. Browser crypto/subtle and Node crypto remain adapter utilities.

Core package exports types from `dist/index.d.ts`, browser condition from `src/index.ts`, default from `dist/index.js`. This lets Vite bundle current sources/workers while Node CLI consumes compiled ESM. Root typecheck builds core declarations before checking CLI/web. Root tests use Vitest include globs with Node environment; browser behavior is tested by Playwright, not jsdom.

## 3. Files to Create, Modify, and Preserve

Paths below are repository-relative. No existing document is deleted. The listed source files are to be created after plan approval, not during this documentation task.

### 3.1 Root and documentation

Create `package.json`, `package-lock.json`, `.nvmrc`, `tsconfig.base.json`, `vitest.config.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`. Modify `.gitignore` for `node_modules/`, all workspace `dist/`, `coverage/`, `test-results/`, `playwright-report/`, and `.vite/`; keep lockfiles/examples/evidence tracked.

Create `docs/third_party.md` listing dependency licenses/notice locations (not a license grant for this project), `docs/language.md`, `docs/architecture.md`, `docs/bytecode.md`, `docs/testing.md`, `docs/evaluation.md`, `docs/assignment_report.md`, and `docs/demo_script.md`. Documentation must describe executed behavior only as completed after verification. Modify README with actual commands, requirements, screenshots, known limits, and links only once these exist. Do not create LICENSE.

### 3.2 Core package

Create `packages/core/package.json`, `tsconfig.json`, `tsconfig.tests.json`, and:

- `src/index.ts`: exports public APIs, schemas, limits, and required model types; not internal mutable solver structures.
- `src/model.ts`: token/AST/symbol/IR/taint/bytecode/result unions.
- `src/contracts.ts`: strict Zod boundary schemas and versioned request/result validation.
- `src/limits.ts`: immutable release defaults and `BudgetGuard` counters/deadlines.
- `src/source.ts`: line index, span creation, UTF-8 byte count, diagnostic span checks.
- `src/diagnostics.ts`: stable diagnostic codes, constructors, severity/stage mapping.
- `src/lexer.ts`: tokenize; no parser dependencies.
- `src/parser.ts`: `Parser` with precedence routines and `parseProgram`.
- `src/semantic.ts`: `SemanticChecker`, scopes/symbols/types, source-call IDs, template notices.
- `src/lower.ts`: `Lowerer` for typed slots and instruction graph; source-map construction.
- `src/graph.ts`: edge/predecessor/successor derivation and structural validation.
- `src/taint.ts`: set operations, transfers, `solveTaint` FIFO worklist.
- `src/provenance.ts`: bounded fact extraction and cycle-safe explanation traversal.
- `src/findings.ts`: `collectFindings` using converged sink inputs; stable deduplication.
- `src/replay.ts`: delta recording/checkpoint reconstruction.
- `src/codegen.ts`: `generateBytecode` and textual disassembly.
- `src/verify.ts`: bytecode operand/type/stack/initialization verification.
- `src/vm.ts`: `runBytecode`, exact arithmetic, event/input/stack limits.
- `src/analyze.ts`: `analyzeSource` coordinator, terminal outcome conversion, stage progress.
- `src/report.ts`: JSON/Markdown serialization and export size enforcement.

Create focused tests under `packages/core/test/`: `source`, `lexer`, `parser`, `semantic`, `lower`, `taint`, `provenance`, `replay`, `codegen`, `verify`, `vm`, `analyze`, `contracts`, `report`, `fixtures` `.test.ts` files. Each corresponds to meaningful behavior in section 14.

### 3.3 CLI package

Create `packages/cli/package.json`, `tsconfig.json`, `tsconfig.tests.json`, `src/main.ts`, `src/options.ts`, `src/io.ts`, `src/run.ts`, and `test/cli.test.ts`.

`main.ts` handles process exit/signals and invokes `runCli`. `options.ts` parses a fixed flag set. `io.ts` performs explicit UTF-8 file reading/size checks and no-clobber writes. `run.ts` creates snapshots, calls core, merges optional runtime results, and routes stdout/stderr. Tests spawn the built CLI in isolated temporary directories.

### 3.4 Web application

Create `apps/web/package.json`, `index.html`, `tsconfig.json`, `vite.config.ts`, and:

- `src/main.tsx`, `src/App.tsx`, `src/styles.css`: application entry and desktop layout.
- `src/workspace/reducer.ts`, `types.ts`, `selectors.ts`, `useWorkspace.ts`: one explicit state machine and request lifecycle.
- `src/workers/analysis.worker.ts`, `execution.worker.ts`, `layout.worker.ts`: core analyze, bounded run, and Dagre layout respectively.
- `src/adapters/workerClient.ts`, `executionClient.ts`, `layoutClient.ts`: identity checks, watchdogs, terminate/recreate, message validation.
- `src/adapters/snapshot.ts`, `files.ts`, `downloads.ts`: revision/checksum, explicit file read/save/export, safe Blob lifecycle.
- `src/editor/monaco.ts`, `language.ts`: self-hosted editor worker wiring, `.fg` syntax definition, markers/highlights.
- `src/components/SourceEditor.tsx`, `Toolbar.tsx`, `StatusBar.tsx`, `GraphPanel.tsx`, `GraphNode.tsx`, `GraphList.tsx`, `FindingsPanel.tsx`, `InspectorPanel.tsx`, `ReplayControls.tsx`, `BytecodePanel.tsx`, `RuntimePanel.tsx`, `InputsPanel.tsx`, `ExamplesPanel.tsx`, `HelpPanel.tsx`, `ReplaceSourceDialog.tsx`, `ExportPanel.tsx`.

Create browser tests `apps/web/test/workspace.spec.ts`, `failures.spec.ts`, `runtime.spec.ts`, `accessibility.spec.ts`, `offline.spec.ts`. Create reducer/adapter unit tests under `apps/web/test/unit/` to exercise stale/duplicate/error messages without requiring slow full-browser fixtures.

### 3.5 Examples, fixtures, and evidence

Create `examples/catalog.json` and `.fg` files named `unsafe-query`, `bound-query`, `branch-merge`, `trusted-overwrite`, `loop-flow`, `multiple-sources`, `short-circuit`, `arithmetic-loop`, `runtime-error`. Catalog supplies ID/title/purpose/source filename/expected findings/input values/expected runtime behavior.

Create `fixtures/manifest.json`, separate valid/invalid fixture `.fg` files, and runtime input JSON files. Manifest stores independently derived expected diagnostic codes, sink spans/rules/source IDs, and runtime events/outcomes; it is not auto-generated from analyzer output.

Create `scripts/evaluate.ts`, `scripts/benchmark.ts` and root `tsconfig.scripts.json`. Compiled scripts write user-requested evidence under `docs/evidence/`; temporary measurements stay under ignored `test-results/` until reviewed. Include fixture IDs, versions, raw runs, hardware, and limits. No invented screenshots/results are committed.

## 4. Exact Data and Public Interfaces

### 4.1 Common conventions

All boundary objects use strict schemas, rejecting unknown fields. Fields described as optional are omitted, not set to undefined/null. Arrays are ordered; sets serialize as numeric-ID-order arrays. Scalar value is a discriminated record with type `int|string|bool` and corresponding number/string/boolean value; integer numbers must be signed-32-bit integral.

`SourceSpan`: `start`, `end` UTF-16 offsets; `startLine`, `startColumn`, `endLine`, `endColumn` one-based positions. All refer to original source, end-exclusive. Use the PRD's BOM/CRLF conventions exactly.

`SourceSnapshot`: `snapshotId`, `revision` (nonnegative integer), `filename` (basename display only), `source`, `sha256` (hex of exact UTF-8 text). Adapter-generated snapshot ID is `snapshot-<revision>-<sha256>`; checksum is identity, not a permission check. Reject malformed checksums at boundaries; recompute in adapters before sending.

`Diagnostic`: `code`, `stage`, `severity` (`error|warning|notice`), `message`, `blocking`, optional `span`, optional related spans. Compile errors are severity error/blocking; template uncertainty is notice/nonblocking. Resource/internal errors need not invent a source span.

### 4.2 Compiler artifacts

`Token`: `id`, `kind`, `span`, `lexeme`, optional decoded `literal`. EOF has a zero-width span at source end.

AST variants: Program(statements); Block(statements); Declaration(name/nameSpan/type/initializer); Assignment(target/targetSpan/value); If(condition/then/optionalElse); While(condition/body); EffectCall(name/args); Literal(scalar); Variable(name); Unary(op/operand); Binary(op/left/right); InputCall(prompt). Each has `id`, `kind`, `span`. Assign IDs by AST preorder after parsing, independent of parser construction order. Validate AST payloads iteratively under the total AST-node cap: binary chains must not hit an extra transport depth limit. Parsed effect arguments remain in invalid-source ASTs even when arity is wrong; signature checks are semantic, not AST-schema checks.

`SemanticModel`: `symbols`, `scopes`, `expressionTypes`, `resolvedUses`, `inputSources`, `diagnostics`. Symbol fields: ID/name/type/declarationSpan/scopeId/slotId/topLevel. Scopes: ID/parentId/AST span/declared symbols. `expressionTypes` and `resolvedUses` key by AST ID. Sources sort by input-call span, ID `src-N`.

`TypedSlot`: ID/type/optional symbolId/displayName/temporary boolean. Allocate all user slots by symbol order, then temporary slots in lowering order. Slot index is the numeric suffix; count finite and checked.

`LoweredProgram`: slots/instructions/edges/entryNodeId/exitNodeId/sourceMap. Instruction variants and fields:

- const(dst, scalar); copy(dst, src); unary(dst, op, src); binary(dst, op, left, right).
- input(dst, promptSlot, sourceId); effect(effectName, argSlots, effectAstId).
- branch(conditionSlot, trueTarget, falseTarget); jump(target); halt.

Every instruction has ID `ir-N`, span, owner AST ID, and visibleSymbolIds. Targets are instruction IDs after label resolution. Graph edges derive only from control instruction targets or sequential next; edges carry from/to/kind and stable ID. Loop-back kind is assigned by lowering metadata, not guessed from layout.

### 4.3 Static results

`SerializedState`: reachable boolean; sorted entries `{slotId, sourceIds}` for all slots when reached; empty entries when unreachable. Solver internal state uses fixed indexed sets, not repeated JSON clones.

`TaintResult`: per-node in/out states, processedNodeCount, updateCount, final reached nodes. `Finding`: ID `rule:effectAstId:argIndex`, rule `SQL_QUERY_TEXT|SHELL_COMMAND_TEXT`, sinkNodeId/effectAstId/argIndex/span/sourceIds/explanationFactIds/explanationComplete. Only argument 0 is sensitive for query/bind/shell. Runtime events never count as static findings.

`ExplanationFact`: deterministic fact ID, nodeId, slotId, sourceId, predecessor references, kind (`source|copy|operator|merge|cycle`), span. Facts are deduplicated by node/slot/source/contributing edge; cap without discarding taint.

`ReplayTrace`: events/checkpoints/truncated/droppedEventCount. Event: index/nodeId/changes (slotId,beforeSources,afterSources)/reachability before+after. Checkpoint: eventIndex and per-node output states. The cap includes serialized checkpoint bytes. Record an initial checkpoint plus every 100th recorded event; stop recording/checkpointing when count/byte budget is reached, but continue solving.

### 4.4 Analysis requests and terminal results

`AnalyzeRequest`: type `analyze`, protocolVersion `1`, requestId, snapshot, options `{recordReplay: boolean}`. Limits are fixed, not supplied by untrusted source or raised by a caller. Default recordReplay true in UI, false in CLI unless `--trace`.

`Progress`: type `progress`, protocolVersion, requestId, revision, stage (`validate|lex|parse|semantic|lower|taint|findings|codegen|verify`), completedWork count when meaningful. No fabricated percentage.

`EffectiveLimits` contains camelCase fields for every PRD cap, including maxStateCells/maxSourceMemberships; it is immutable and emitted unchanged. Byte budgets are integer bytes, time budgets integer milliseconds. `AnalysisResult`: type `analysis-result`, schemaVersion `1`, requestId, snapshot (required except invalid-request), analyzerVersion `0.1.0`, languageVersion `1`, status, completedStages, diagnostics, artifacts, limits, statistics, limitations. Artifacts contains optional tokens/ast/semantic/lowered/taint/findings/replay/bytecode/disassembly according to completed stages. Completed requires every artifact except disabled replay. Findings and bytecode are absent for noncompleted outcomes, even if lower stages finished. No `safe` flag exists.

Statistics: sourceUtf8Bytes/tokenCount/astCount/slotCount/cfgNodeCount/inputSourceCount/processedNodeCount/updateCount/bytecodeCount/stageDurationsMs/totalDurationMs. Missing-stage counts are zero, not guessed. Limitations list structural path overapproximation, explicit flow only, synthetic sinks, placeholder uncertainty where present, and presentation truncation where present.

Public core functions: `analyzeSource(request, hooks) → AnalysisResult`; hooks supply `nowMs`, `onProgress`, `checkpointAbort`. Synchronous engine work runs in a worker/CLI process. `validateAnalysisRequest` returns typed input or invalid-request diagnostics. `serializeReport(report, format) → string` validates version/invariants and enforces byte size. `buildReport(analysis, optionalExecution) → Report` verifies matching identities.

Report envelope: schemaVersion/analysis/optionalExecution. Report export is not report import. JSON includes all selected artifacts. Markdown includes source, diagnostics, findings/limitations, compiler summaries, disassembly, optional runtime, limits/statistics; full token/AST/replay details remain available in JSON.

## 5. Lexer, Parser, and Semantic Algorithms

`buildLineIndex` scans exact source once; CRLF advances one line/two offsets. `makeSpan` binary-searches line starts; Unicode columns count JS UTF-16 units. Source byte count uses TextEncoder; file adapters use fatal UTF-8 decoding with TextDecoder `ignoreBOM: true` to preserve a leading BOM after stat/byte limits. Do not normalize newlines.

Lexer runs left-to-right, longest operator first (`&& || == != <= >=` before single-character operators), skipping whitespace/comments while retaining offsets. Count tokens and comment/string scan units for budgets. Fail at the first invalid character, unknown escape, unterminated literal/comment, or unsupported integer literal. A leading BOM is allowed only at offset 0; later BOM outside a string is invalid. Emit EOF.

Parser has exact precedence routines from the PRD; nesting counter enters parentheses, unary recursion, and nested blocks/conditions and fails at 129. Program/block statement loops also check budgets. Parse effect calls only in statement position and `input` only in expression position. Stop on the first parser error; avoid guessed recovery and incomplete AST masquerading as valid. Allocate AST IDs after successful parsing.

Semantic checker traverses in source order with a scope stack. Look up visible names before declaring; resolve initializer before adding the new name. An inner declaration with a visible name is invalid, including a declaration inside a loop. Disjoint sibling blocks can reuse a spelling because IDs differ. Conditions must be boolean; every variable reference resolves to a symbol. All operand and builtin type rules match PRD section 6.

Collect up to 100 semantic diagnostics, then add `TOO_MANY_DIAGNOSTICS` and stop checking. This cap affects invalid-source diagnostics, not taint validity. Numeric literal rule/unknown escape errors are source errors; resource limits are incomplete-limit. Direct literal placeholder count uses decoded string characters; count `?` without claiming SQL parsing. Nonliteral templates receive one notice per call. Blocking errors stop lowering; nonblocking notices continue.

Exact public phase signatures: `lex(snapshot,guard) → Token[]`; `parse(tokens,snapshot,guard) → Program`; `checkSemantics(program,snapshot,guard) → SemanticModel`; `lowerProgram(program,semantic,guard) → LoweredProgram`. Each throws a typed SourceFailure or LimitFailure handled only by coordinator; unexpected exceptions become internal-error.

## 6. Lowering and Control-Flow Construction

Each IR instruction occupies one node. Maintain a symbolic instruction list and labels, then resolve labels to zero-based instruction indexes. Halt is the final instruction and the unique exit. Scope symbols/slots remain allocated for the whole compilation; `visibleSymbolIds` describes lexical visibility for presentation. This avoids iteration-dependent allocation and preserves finite analysis.

Lower all ordinary value expressions to fresh typed temporary slots, in evaluation order. Variable references may return their user slot directly; constants create const nodes; nonlogical unary/binary operations create typed nodes after operands. Declarations/assignments end with copy to the resolved user slot. Effects evaluate arguments left-to-right before their effect node.

For `left && right`: lower left; branch to right-evaluation or false-result block; false-result writes false to a fresh result slot and jumps to merge; right block writes the right value to the same result slot and jumps to merge. For `||`, the true-result block writes true and the other block evaluates right. All CFG alternatives remain present for static may-analysis, even literal false/true.

For `if`: lower condition (including short circuit), branch to then/else; each ends with jump to following merge label. Missing else is an empty false path. For `while`: test label precedes condition; true enters body; body jumps back to test; false goes to following label. Evaluate input occurrences in the condition each runtime iteration but reuse their static source ID.

Remove no unreachable structural alternatives and perform no optimizer passes. Resolve consecutive empty labels to the next instruction. Validate every target, edge, slot type/reference, instruction ID, owner AST ID, and source span. Exceeding graph/slot/instruction budgets stops compilation. Graph layout cannot change any target or edge.

## 7. Solver, Provenance, and Replay Algorithms

### 7.1 State and worklist

Use a state containing reached flag and an array of source-index sets, one per slot. Represent sets as sorted integer arrays with linear union/equality, given the fixed 256-source cap. Use interned empty set and copy-on-write arrays; never mutate predecessor states when transferring. Before allocating per-node input/output arrays, validate `2 × nodeCount × slotCount ≤ 4,000,000`. Count retained per-node source memberships conservatively, regardless of set sharing, and return LIMIT_ANALYSIS_STORAGE before exceeding 2,000,000; decrement counts when replacing a state. Temporary transfer/merge buffers are released or reused, not retained between pops. Deterministic FIFO worklist uses an array/head index and membership boolean array; periodically compact the queue.

Entry is reached with every slot empty; other nodes are unvisited. On pop, merge all reached predecessor outputs (entry also has the initial empty environment), apply the exact PRD transfer, and compare. Reachability/output changes enqueue successors in instruction-index order. Count each popped node against the 200,000 cap. Publish progress at stage start and every 256 processed nodes, not every tiny set union.

Branch/jump/halt/effect transfer the same state. Input overwrites its destination with its syntactic source singleton. Const clears destination; copy/unary uses operand set; binary unions operands. A user assignment therefore kills old explicit taint for that slot. Joins union all slots. No implicit-control flow propagation. New iterations never allocate source/slot identities.

After convergence derive sink argument contributions from node input states. Stable order: sink start offset, rule, argument index. Do not emit tentative findings during solving as final results. Make one finding per call/argument/rule with sorted source IDs.

### 7.2 Provenance

After convergence, build dependency facts for tracked slot/source pairs from final transfers and predecessors; do not retain an unbounded history of solver iterations. Input defines source facts; copies/operators link operand facts; unchanged slots link predecessor outputs; multiple predecessors create merge facts. Traverse from each sink contribution backwards using a visited `(node,slot,source)` key. Cycle detection creates a cycle marker, not a recursive infinite path. Sort fact traversal by predecessor index.

Cap deduplicated facts at 20,000 globally and displayed facts at 200 per finding. Source sets remain complete when facts are capped; mark `explanationComplete=false`. Do not produce a narrative claiming all displayed edges form one feasible execution. Use causal fragments and merge/cycle labels.

### 7.3 Replay

Record only changed node outputs/reachability, not every worklist pop. Deltas contain enough old/new data to apply and undo. Reconstruct from nearest earlier checkpoint, applying events to reach selected event index. Use an incremental JSON size counter/writer that checks UTF-8 chunks before retaining them; account for escaping rather than assuming source string byte size equals serialized size. Count bytes when adding an event/checkpoint; 8 MiB/count limits stop recording. Dropped-event count includes subsequent output updates. Trace truncation does not interrupt analysis. Maintain only bounded checkpoints; never hold a full state copy per event.

Public APIs: `solveTaint(program,guard,recorder) → TaintResult`; `collectFindings(program,states,semantic) → Finding[]`; `buildProvenance(program,states,findings,guard) → explanations`; `reconstructReplay(trace,index) → per-node output states`. Replay index -1 means initial checkpoint; end matches solver outputs only if recording completed.

## 8. Bytecode Specification and Verification

`BytecodeArtifact`: version `1`, snapshotId, sourceSha256, slots, topLevelSymbolIds, sourceIds (ordered static source IDs), constants, instructions, sourceMap, maxVerifiedStack. `topLevelSymbolIds` is required, bounded by the slot cap, unique and sorted in numeric symbol order; every identity references a nontemporary user slot. Generate it from the final lowered HALT's visible symbols, including declarations that runtime may not reach. Constants are typed scalar records deduplicated by type/value in first-use order. Instruction fields are `opcode` and `operands` (numeric array with exactly the opcode-defined arity). `sourceMap` is an array with one `{pc, irNodeId, astId, span}` entry per emitted instruction. `INPUT sourceIndex` refers to artifact sourceIds and must be in range. No executable JS strings.

Opcode inventory and stack behavior:

- `PUSH_CONST constantIndex`: push typed constant.
- `LOAD slotIndex`: push initialized slot value; `STORE slotIndex`: pop matching typed value.
- `NEG_INT`, `NOT_BOOL`: pop correct operand, push result.
- `ADD_INT`, `SUB_INT`, `MUL_INT`, `DIV_INT`, `MOD_INT`: pop right then left integer, push integer.
- `CONCAT_STRING`: pop right then left string, push string.
- `LT_INT`, `LE_INT`, `GT_INT`, `GE_INT`: pop integers, push boolean.
- `EQ`, `NE`: pop two same-typed scalar values, push boolean.
- `JUMP targetPc`: change PC; `JUMP_IF_FALSE targetPc`: pop boolean and choose branch.
- `INPUT sourceIndex`: pop string prompt, consume input, push string.
- `PRINT`: pop one scalar; `SQL_QUERY`, `SHELL`: pop string; `SQL_BIND`: pop scalar bound value then string template. Effects push nothing.
- `HALT`: requires empty operand stack; terminate.

Each lowered instruction compiles independently with empty stack at its boundaries: operands LOAD; operation; destination STORE. Const emits PUSH/STORE. Effect emits ordered LOADs then effect opcode. Branch emits LOAD/JUMP_IF_FALSE false/JUMP true. Jump emits JUMP; halt emits HALT. Record the first bytecode PC for each IR node, patch targets in a second pass, and map every emitted PC to IR ID/AST/span. Do not add AND/OR opcodes that defeat lowering.

`verifyBytecode` checks schemas/version/constants/operand ranges/opcode operands, source references, jump target instruction boundaries, slot operand types, and all structurally reachable control-flow stacks. First compute structural reachability. Propagate abstract stack types from the entry with empty stack; every reached join must have identical stack depths/types. Separately compute definite initialization as a greatest fixed point: entry includes an external empty initialization set, other reached nodes initially have the full slot universe, merges intersect reached predecessor outputs, and STORE adds its slot. Iterate to stability, then check each LOAD against the final incoming set. Never reject a LOAD merely because an earlier iteration has not processed its predecessors. Cap both verifier analyses by the shared compile budget and 200,000 node visits per verifier analysis. Every reachable HALT must have empty stack; no fall-off past end. Reject inconsistent/uninitialized/overflow-stack bytecode as `BYTECODE_INVALID` internal-error, because generated code should already be correct.

Public `generateBytecode(lowered,snapshot,guard) → BytecodeArtifact`; `verifyBytecode(artifact,guard) → maxStack`; `disassembleBytecode(artifact) → lines with PC/opcode/operands/source`. The execution entry verifies again; UI cannot bypass this by asserting a ready flag. Bytecode file import/export as a standalone executable is outside scope; report contains the artifact for inspection only.

## 9. VM Execution and Runtime Contract

`ExecutionRequest`: type `execute`, protocolVersion `1`, requestId, snapshotId, revision, bytecode, inputs (string array). `ExecutionResult`: schemaVersion/requestId/snapshotId/revision/status, diagnostics, events, consumedInputCount, instructionCount, elapsedMs, finalTopLevelValues, limits. `ExecutionEvent` common fields are index/kind/span/pc. Discriminated payloads: input has sourceId/prompt/value strings; print has value scalar; sql-query has query string/simulated true; sql-bind has template string/value scalar/simulated true; shell has command string/simulated true. `finalTopLevelValues` is an array in symbol order of `{symbolId,name,value}`. No SQL/shell returns a value.

Input order is runtime encounter order, not static source occurrence order. Each INPUT consumes one item; missing input is `RUNTIME_INPUT_EXHAUSTED`, runtime-error. Unused supplied strings are allowed and reported. Validate total input UTF-8 ≤1 MiB, ≤1,000 items, each string ≤64 KiB before running. Input UI is a JSON array editor initialized to `[]`; malformed/nonstring input disables Run with a field error.

VM stores typed scalar slots (initially uninitialized), an operand stack, PC, counters, and bounded events. Use BigInt internally for integer arithmetic then range-check and convert to serializable number. Division uses BigInt truncation and modulo semantics. Detect zero and `-2147483648 / -1` overflow. Check concatenated UTF-8 size before retaining it. Values remain typed; no coercion or defaulting uninitialized slots.

Every opcode increments count, checks instruction/stack/time bounds, and applies semantics. PUSH_CONST and LOAD also enforce per-string size before placing a value on the stack; STORE does not clone scalar string payloads. Time checks every 256 instructions plus effect/input/loop-target boundaries. Independent browser watchdog enforces wall deadline. Missing input, divide/remainder zero, and overflow are runtime-error; instruction/time/stack/string/event budget exhaustion is incomplete-limit. Unknown opcodes/types/invalid PC after verification are internal-error. Do not return completed until HALT.

Retain at most 1,000 events and 1 MiB serialized event payload; attempting another returns incomplete-limit with previous events, never silent successful truncation. `finalTopLevelValues` projects only initialized slots referenced by verified `topLevelSymbolIds`, in symbol order, on completed runs and core-reported runtime errors, limits or cancellation. Block-local/temporary slots and uninitialized declarations are omitted. Unverified requests expose no values. A forcibly terminated browser worker cannot return its local values/events; cancellation/watchdog transport results remain empty. Track aggregate UTF-8 string bytes retained in slots and stack with a 4 MiB cap, counting references conservatively even when JS shares an immutable string. Pop/replacement decrements retained accounting; LOAD/PUSH/STORE and concatenation check before adding values. Return LIMIT_VM_STORAGE on excess. Total slots ≤4,000 and strings/events are independently bounded; no enforceable OS heap quota is claimed.

`runBytecode(request,hooks) → ExecutionResult` verifies input/bytecode then executes. Browser execution worker is distinct from analysis/layout workers. CLI runtime uses the same API. SIGINT/cancel retains static result but labels runtime cancelled. Report runtime identity must match analysis snapshot/checksum; a mismatched execution is rejected by serializer.

## 10. Limits, Coordinator, and Failure Mapping

Implement `BudgetGuard` with fixed PRD caps: source 262,144 bytes; nesting 128; tokens 65,536; AST 20,000; slots 4,000; CFG 2,000; input sources 256; bytecode instructions 50,000; solver pops 200,000; verifier visits 200,000 per pass; retained in/out state cells 4,000,000; retained source-set memberships 2,000,000; compile deadline 10,000 ms; replay 10,000 events/8,388,608 bytes; provenance 20,000 facts/200 visible per finding; report 16,777,216 bytes. VM caps are exactly PRD section 14. Report configured limits even when stages fail.

All caps are maximum allowed counts; fail when attempting max+1. Deadline fails at elapsed ≥cap. Source/request validation happens before recursive schemas or lexing; schema parsing must not recurse on arbitrary giant source artifacts supplied by users. Direct core API remains budgeted, including codegen/verifier/report serialization. Use `performance.now` adapter clock. Check every 256 units and at stage/loop boundaries. Browser analysis watchdog fires at 10,250 ms and execution watchdog at 1,250 ms, labels incomplete-limit, and recreates worker; normal core deadlines are 10,000/1,000 ms.

Coordinator stages: validate, lex, parse, semantic, lower, taint, findings (including provenance), codegen, verify. Retain stage-completed artifacts incrementally; freeze accepted result objects or treat them immutably. Return exactly one terminal result. For a malformed envelope, return invalid-request with requestId from a valid raw string field or `invalid-request` if absent; include snapshot only when its schema is valid, and omit all compiler artifacts. A worker client unable to correlate such an invalid message treats it as WORKER_FAILED for its own active request. For invalid source, preserve tokens/full AST/semantic only when those stages completed; never fabricate half a tree. For taint/codegen/verifier failures, do not expose final findings/runnable bytecode as successful artifacts. Keep partial graph/states labeled where safe. No retry inside semantic algorithms; adapters offer an explicit new run.

Diagnostic code families and exact status mapping:

- `REQUEST_INVALID`, `SCHEMA_UNSUPPORTED`, `INPUTS_INVALID`: invalid-request.
- `LEX_INVALID_CHAR`, `LEX_UNTERMINATED_STRING`, `LEX_UNTERMINATED_COMMENT`, `LEX_INVALID_ESCAPE`, `LEX_INTEGER_RANGE`, `PARSE_EXPECTED`, `SEM_UNDECLARED`, `SEM_DUPLICATE`, `SEM_SHADOWING`, `SEM_TYPE`, `SEM_ARGUMENTS`, `SEM_TEMPLATE_PLACEHOLDERS`, `TOO_MANY_DIAGNOSTICS`: invalid-source.
- `TEMPLATE_UNVERIFIED`: nonblocking notice; completed remains possible.
- `LIMIT_SOURCE`, `LIMIT_NESTING`, `LIMIT_TOKENS`, `LIMIT_AST`, `LIMIT_SLOTS`, `LIMIT_CFG`, `LIMIT_SOURCES`, `LIMIT_SOLVER`, `LIMIT_ANALYSIS_STORAGE`, `LIMIT_COMPILE_TIME`, `LIMIT_BYTECODE`: incomplete-limit.
- `BYTECODE_INVALID`, `ENGINE_INTERNAL`, `WORKER_FAILED`: internal-error.
- `RUNTIME_INPUT_EXHAUSTED`, `RUNTIME_DIV_ZERO`, `RUNTIME_INT_OVERFLOW`: runtime-error.
- `LIMIT_VM_TIME`, `LIMIT_VM_INSTRUCTIONS`, `LIMIT_VM_STACK`, `LIMIT_VM_STRING`, `LIMIT_VM_STORAGE`, `LIMIT_VM_EVENTS`, `LIMIT_VM_OUTPUT`: runtime incomplete-limit.
- `CANCELLED`: cancelled, not invalid-source.
- `FILE_ENCODING`, `FILE_TOO_LARGE`, `FILE_READ`, `OUTPUT_EXISTS`, `OUTPUT_WRITE`, `REPORT_TOO_LARGE`, `LAYOUT_FAILED`: adapter/export/layout diagnostics; never relabel successful static analysis because a download/layout failed.

No stack traces/source text in normal internal-error messages. Developer debugging may use opt-in console diagnostics without whole source payloads; no telemetry.

## 11. Worker Transport and Browser State Machine

### 11.1 Worker clients

Snapshot hashing captures source/revision before awaiting crypto.subtle SHA-256; if revision changes before hashing finishes, discard it and do not dispatch the old request. CLI uses Node SHA-256 over the same exact UTF-8 bytes. Analyze client constructs worker using a bundled module URL, creates monotonically increasing request IDs, stores active snapshot identity, sets watchdog, validates every message, and forwards current progress/result to reducer. Worker calls core and sends serializable progress/result. Unknown/broken messages terminate the worker and become WORKER_FAILED for the active request; late retired-worker messages are ignored first.

Cancel/edit/load resets the active identity before termination. Cancellation dispatches a local terminal state, terminates the worker, clears timer, and creates a fresh worker only when another request starts. This avoids relying on a cancel message queued behind synchronous computation. Exactly one accepted terminal result per request; completion clears watchdog and terminates the one-shot worker.

Execution client uses the same pattern and separate identity, same source revision, VM deadline, and validated execution result. Require no active analysis/execution and current completed bytecode. Layout client owns separate request ID/result identity and 2-second watchdog; stale layout is ignored. Layout failure/fallback does not invalidate core result.

### 11.2 State and actions

Workspace fields: source/filename/revision/dirty; panel; analysisStatus; activeAnalysisId; currentAnalysis; selectedFindingId/selectedNodeId/selectedBytecodePc; replayIndex/playing; inputJson/inputValidation; runtimeStatus/activeExecutionId/currentExecution; graphLayoutStatus/positions; adapterNotice.

Actions: SOURCE_SAVED (matching revision clears dirty after download initiation), EDIT_SOURCE, REQUEST_REPLACEMENT, CONFIRM_SAVE_REPLACE, CONFIRM_DISCARD_REPLACE, CANCEL_REPLACEMENT, START_ANALYSIS, ANALYSIS_PROGRESS, ANALYSIS_TERMINAL, CANCEL_ANALYSIS, SELECT_FINDING, SELECT_NODE, SELECT_BYTECODE, SET_REPLAY_INDEX, SET_REPLAY_PLAYING, SET_INPUTS, START_EXECUTION, EXECUTION_TERMINAL, CANCEL_EXECUTION, LAYOUT_RESULT, LAYOUT_ERROR, EXPORT_SUCCESS/ERROR, SET_PANEL.

EDIT_SOURCE increments revision, sets dirty, cancels workers via controller effect, invalidates current result for marks/Run, pauses replay, resets selections/runtime. Keep previous immutable result available only as previous-snapshot export. Inputs edits invalidate only previous runtime inputs/result, not static compilation. New successful analysis resets replay to final static view (index end, paused), starts layout, and resets runtime to idle. Invalid analysis removes current finding/bytecode presentation for that revision. Result displays never derive spans from stale source.

Reducer is pure; worker/files/download/timer side effects live in `useWorkspace`/adapters. State labels match PRD section 12. Input validation distinguishes invalid JSON from running failures. Analyze disabled for whitespace-only source or active processing. Run disabled unless current completed bytecode, valid inputs, and no active processing. Save can work during analysis from current source. Export always states which snapshot it uses.

### 11.3 Replay presentation

Default inspector uses final in/out states. Enter replay switches to reconstructed recorded output states and labels them “Analysis update N”; final completed states remain a separate selectable view. Next/previous adjust by one event; reset selects initial (-1); play ticks every 400 ms using requestAnimationFrame/time accumulator and stops at end. Reduced motion disables autoplay/start-play; manual stepping remains enabled. Editing/reset/new analysis cancels frame callbacks.

Trace truncated notice offers “View final analysis”; do not imply last recorded event is fixed point. Checkpoint reconstruction occurs in bounded UI work; if it exceeds a 250 ms interaction target, move reconstruction to analysis worker in a reviewed plan change rather than freeze silently.

## 12. UI Components, Navigation, Layout, and Accessibility

Use one desktop page, minimum supported viewport 1280×720. Layout: header/status row; left source editor (~40% width); center graph (~35%); right findings/inspector (~25%); bottom collapsible runtime/inputs and replay controls. At 1024–1279 pixels switch center/right to tabs; below 1024 show desktop-size guidance while preserving source saving. No new route/login/dashboard.

Monaco registers `flowguard`, extension `.fg`, token coloring, brackets, comments, and supported keywords. Configure its editor worker via Vite `?worker` import; do not load CDN assets or use `@monaco-editor/react` default remote loader. Convert span positions directly to marker ranges, including zero-width EOF diagnostics. Dispose editor/listeners/worker references on unmount. Keep original text independent of Monaco line-ending normalization/BOM stripping; apply editor changes via original-source line indexes and compensate BOM in editor marker coordinates. Preserve exact bytes for save and snapshot hashing.

Graph layout runs Dagre with top-to-bottom direction, fixed node width 180/height 64, rank separation 70/node separation 30. Label nodes by instruction kind plus compact source/slot summary. React Flow handles zoom/pan/fit; graph is view-only, no user-created edges. Input source/sink/merge/loop use labels and icons/colors. For >200 nodes, layout error, or timeout, show searchable node/edge list with identical selections/inspectors. Do not filter semantic edges to make the graph prettier.

Findings show rule, sink line/column, input sources, possible-flow explanation, and incompleteness notice if needed. Inspector tabs render tokens/AST/symbols/states/bytecode using text, expandable lists, and bounded pagination (100 rows/page). Bytecode selection displays PC/opcode/operands/source and links to associated graph node; no runtime step debugger is required.

Runtime panel shows explicit “Simulated execution” label, supplied input count, events, final top-level values, instruction/time stats, and runtime outcome. SQL/shell entries say “Simulated SQL query/bound query/shell command.” Render all payloads through text nodes, never dangerouslySetInnerHTML.

Examples/Help are controlled panels, not navigation that destroys source. Dirty is set by edit/load until explicit save; initial built-in example load is not automatically called saved. Replacement dialog offers save/discard/cancel. Save triggers download then replacement only after serialization/download initiation; describe browser download limitations accurately. Beforeunload warns for dirty source where browser permits; no autosave is added.

Use labeled buttons, focus-visible outlines, keyboard selection/Enter activation, ARIA tab roles/live status, focus return after dialogs, sufficient contrast, and non-color-only explanations. Ctrl/Cmd+Enter triggers Analyze if allowed; Escape closes panels/dialogs without discarding source. Help documents these shortcuts. Runtime input JSON textarea has an associated error label and example `[]`.

## 13. CLI, Reports, Packaging, and CI

### 13.1 CLI exact interface

The built command is `node packages/cli/dist/main.js <source.fg> [flags]`; root `npm run flowguard -- ...` invokes it after a documented build.

Flags: `--format json|markdown` (default json), `--output <path>` (default stdout), `--overwrite` (only with output), `--trace` (default off), `--run`, `--inputs <json-file>` (only with run), `--help`, `--version`. Unknown/duplicate/value-missing flags and extra positional arguments are invalid-request. No flag raises limits, imports bytecode, runs an actual shell, or fetches a URL.

Read UTF-8 source with fatal decoder and byte limit, preserving filename basename for report. Inputs file must satisfy the runtime schema. For output use exclusive file creation (`wx`); overwrite explicitly uses replacement write and reports I/O failures. Do not make parent directories implicitly. Check output bytes before writing. Progress messages go to stderr and are throttled; default report-only stdout remains parseable.

Exit codes: 0 completed static run without findings and, if requested, completed runtime; 1 completed static run with findings and successful/unrequested runtime; 2 invalid-source/request/file input; 3 incomplete/internal/runtime/output failure; 130 user SIGINT. Runtime failure takes precedence over findings status. `--run` runs only after completed analysis; invalid source does not execute. If the runtime fails, still emit a report containing completed static analysis plus failed runtime when serialization/output succeeds.

### 13.2 Reports

JSON uses two-space indentation and trailing newline, stable semantic ordering. Serialize with a capped chunk writer shared with size accounting; reject at 16 MiB before joining chunks, not after creating an unbounded JSON string. Markdown uses the same capped output writer. Markdown uses dynamically sized backtick fences longer than any backtick run in source/event text; never allow source to close a fence and inject fake headings. Include exact source, diagnostics, possible-flow findings, source identities, limitations, compiler summaries, bytecode, runtime (if requested), limits, and statistics. Clearly label incomplete/cancelled results. Do not omit required completion/version fields for compactness.

Web download filenames: `<basename>.flowguard.json|md`; source save `<basename>.fg`; sanitize basename by stripping path separators/control characters and default to `program`. Revoke Blob URLs after download initiation/unmount. Old-snapshot export states its revision and does not include a mismatched runtime result.

### 13.3 Root scripts and build order

Define root scripts:

- `build:core`: core tsc; `build:cli`: core build then CLI tsc.
- `build`: core tsc → CLI tsc → web Vite production build.
- `typecheck`: build core declarations → core/src/tests/scripting TS checks → CLI/src/tests TS checks → web TS checks.
- `test`: core/web-reducer/CLI Vitest run; build core/CLI first for spawned CLI tests.
- `dev`: build core declarations then web Vite dev at `127.0.0.1:5173`, strict port.
- `preview`: web Vite preview at `127.0.0.1:4173`, strict port.
- `flowguard`: node built CLI entry (README says build first).
- `test:e2e`: Playwright against preview production build.
- `evaluate`: compile scripts and run labeled fixtures; `benchmark`: compile scripts and run timing workloads.
- `check`: typecheck → test → build → test:e2e. No benchmark timings as pass/fail on CI.

Vite target supports BigInt/Web Workers on Chromium-based desktop browsers; official support is Playwright-bundled Chromium and current Chrome on macOS/Ubuntu. Safari/Firefox are outside release-1 acceptance and not promised. Bundle worker/core/Monaco assets under `apps/web/dist`; base URL is relative `./`. No service worker or CDN. Core/CLI outputs use `dist/` and declaration maps; no source credentials embedded.

### 13.4 GitHub Actions

Create CI triggered by push and pull_request for all branches, permission contents:read, no pull_request_target, no deploy/publish/write token. Runner `ubuntu-24.04`; one job timeout 15 minutes; cancel superseded runs per workflow/ref. Pin actions to verified SHAs:

- checkout v6.0.2: `de0fac2e4500dabe0009e67214ff5f5447ce83dd`.
- setup-node v6.4.0: `48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e`.
- upload-artifact v6.0.0: `b7c566a772e6b6bfb58ed0dc250532a479d7789f`.

Use Node `.nvmrc`, explicitly ensure npm 11.17.0, npm cache using root lockfile, `npm ci`, `npm run typecheck`, `npm run test`, `npm run build`, `npx playwright install --with-deps chromium`, `npm run test:e2e`. Upload failure-only synthetic Playwright traces/report with 7-day retention; no personal source inputs or secrets. Do not include package publication or deployment. CI has not been created/run during planning.

Playwright webServer starts production preview on loopback 4173, reuseExistingServer false, Chromium only, 1280×800 viewport; screenshots/videos disabled except failure evidence. Root CI installs dependencies; local README explains one-time browser install.

## 14. Tests, Fixtures, and Acceptance Mapping

### 14.1 Required core/CLI fixtures

Use exact fixture categories and independently expected outcomes:

- Valid grammar/types: scalar declarations/assignments, nested scopes, disjoint same names, precedence, string escaping, comments, CRLF/Unicode.
- Invalid source: unknown character/escape, unterminated comment/string, missing semicolon, invalid type/operator, uninitialized declaration, unknown name, same-scope duplicate, forbidden shadowing, self-initializer, wrong call count/type, invalid literal/placeholder count.
- Taint: direct SQL/shell, 3-hop copies, two-source concatenation, trusted overwrite, both branch alternatives, zero-iteration/repeated loop flow, nonliteral template notice, bound input only, tainted binding template, print not sink.
- Short circuit: `false && input("x") == "a"` consumes no input at runtime; `true || input("x") == "a"` consumes none; inverse forms consume one. Static may-taint can still include structural alternatives, explicitly tested/documented.
- Bytecode: generated PC target/source mappings, balanced stacks, every opcode type, joining stacks, invalid operand/jump/constant/version/uninitialized LOAD rejected.
- Runtime: print values, input encounter order, query/bind/shell simulated events, integer loop result, precedence/negative division/remainder, overflow, divide zero, input exhaustion, finite and infinite loops, output/string cap.

Limit tests may inject strictly lower budgets through a private test-only BudgetGuard constructor, never exported release options. Assert failure on cap+1 and success on cap where feasible. Use fake clocks to test deadline behavior without long sleeps. Verify source/error snapshots and CLI report/exit cases in temporary directories.

Graph tests inspect real true/false/back targets and user-visible short-circuit semantics, not only snapshot matching. Provenance tests include cyclic input flow and two-source merges with finite traversal. Replay tests apply/undo/checkpoint events and compare completed trace to final states. Mutation/rename fixtures check semantic invariants.

### 14.2 Browser and adapter checks

Production tests cover example→analyze→finding→source/graph highlight→binding edit→reanalyze; malformed source; no findings; failed file decode; dirty replacement cancel/discard; runtime inputs/events/errors; edit during run; cancel/retry; current/old export identity; text injection payloads; reduced motion; keyboard controls; source-preserving layout fallback.

Reducer/client tests explicitly deliver stale/duplicate/error messages and watchdog cancellation. Browser failure tests inject a layout failure through a test-only adapter seam in the test build, not a release query flag. Offline test permits only the loopback origin after loading and verifies analysis/runtime do not invoke remote services. Test the production asset paths including Monaco and worker entry files.

### 14.3 Traceability

- PRD R-01/02 and AC-01/02: source/lexer/parser/semantic/lower/analyze tests and inspector UI.
- R-03 and AC-03/04/06: taint/findings/provenance fixtures and binding comparison demo.
- R-04/15/16 and AC-09/12: contracts, worker clients/reducer, CLI spawned tests.
- R-05/12/13 and AC-05/10/11: lowering/codegen/verifier/VM fixtures and runtime browser flow.
- R-06/10/11/14/17/18 and AC-07/08/09/12/13: replay/report/UI/export/dirty-state tests.
- R-07/19/20 and AC-13/14: no-persistence/no-external-effects, cap/cancellation/layout/export security tests.
- R-08/21 and AC-15/17: production fresh install, CI run evidence, no-license check.
- R-09 and AC-04/05/07: fixed-point transfers/loop/short-circuit structural tests.
- R-22 and AC-16: labeled evaluation and machine-specific timing evidence.

### 14.4 Evaluation and benchmarks

Manifest labels sensitive argument+rule units and contributing sources; do not label predictions after observing analyzer output. Record TP/FP/FN/TN, precision/recall if denominator nonzero, and invalid/incomplete counts separately. Keep known structurally infeasible false alarms in a separate documented subset and in applicable accuracy counts, not hidden.

Benchmark 20 generated/fixed programs with ≤1,000 nonblank lines/500 actual lowered nodes/50 source calls. Generate from fixed seed and record seed/source checksum. Verify bounds before timing. One warm-up plus 10 measured analyses each; p95 is nearest-rank sorted sample at ceil(0.95*N)-1. Report total engine time separately from graph layout/readiness. Measure selection/cancellation latency from browser events to displayed update, not solver completion.

Record current Mac hardware/OS/Node/npm/Chrome and pinned versions at actual measurement time. Targets are PRD ≤2 s engine, ≤2 s graph for 200 nodes, ≤250 ms selection/cancel. If a target fails, inspect implementation; if unresolved, report and ask for an approved adjustment. Never change target/data silently. CI performs functional checks only.

## 15. Deterministic Phases, Two-Person Ownership, and Schedule

Detailed task views are in the [phase index](phases/README.md): [Phase 0](phases/phase_0_foundation.md), [Phase 1](phases/phase_1_frontend_lowering.md), [Phase 2](phases/phase_2_analysis_explanations.md), [Phase 3](phases/phase_3_codegen_vm.md), and [Phase 4](phases/phase_4_release_validation.md). These views reference the master technical specifications and must remain synchronized.

This is a suggested allocation against the fixed deadline, not a claim that work is complete or a guaranteed delivery estimate. Teammate A owns core algorithms/CLI; teammate B owns web/worker integration/docs. Names/skills are unknown. Both review shared contracts and fixtures. Follow dependencies; do not parallelize incompatible edits to model/contracts/lower files.

### Phase 0 — Contracts and setup (5 October)

Create root/workspace configurations, model/contracts/limits/source/diagnostics, synthetic examples/manifest skeleton, test runners, CI scaffold. Teammate A drafts types/core tests; B reviews contracts and creates UI skeleton/reducer. Gate: clean dependency resolution, typecheck of created modules, and empty-program schema/transport fixtures; real empty-source compilation is tested after front-end/lowering exists. Preserve no-license state. Update state files.

### Phase 1 — Front end and lowering (5–6 October)

A implements lexer/parser/semantic/lower/graph in that order. B builds editor language/markers, empty/loading/error states, example/help/dirty-source flows against versioned fixtures. Gate: all supported grammar/type fixtures, exact spans, branch/loop/short-circuit CFG and no uninitialized IR slot uses. UI fixtures are visibly development fixtures and replaced by real engine before release.

### Phase 2 — Solver, findings, and reports (6 October)

A implements sets/worklist → converged findings → provenance → replay → coordinator/reports/CLI analyze. B wires analysis worker/client, graph layout/selection, inspectors/findings/replay/export. Gate: independently labeled taint/loop/binding static-module and integration fixtures; stale/cancel/partial outcomes tested. Full user-facing completed Analyze and the actual unsafe-to-binding browser demonstration wait for Phase 3 codegen/verifier; do not weaken the completed-result contract or report a mock successful release run.

### Phase 3 — Codegen, verifier, VM, and execution UI (7 October)

A implements codegen → verifier → VM → CLI run/input/error mapping. B adds bytecode view and execution worker/client/input/runtime panel. Gate: short-circuit/loop/arithmetic/modeled-effect fixtures, complete unsafe-to-binding Analyze demo, and production runtime demo; every generated artifact verifies; explicit Run is separate from Analyze. Update PRD/plan only with user approval if a behavior must change.

### Phase 4 — Release checks and submission (7–8 October)

Both run full check, clean install, CI, security/race/accessibility/limits, labeled evaluation, timing workloads, screenshots/recording, README/architecture/language/bytecode/report/demo docs. A produces engine/evaluation explanations; B assembles visual demo/report. Both rehearse and confirm each other's module understanding. Gate: all AC-01–17 evidence, actual measurements, known limitations, synchronized context, no uncommitted/private artifacts.

If a gate fails, fix it before declaring the dependent phase complete. If time cannot accommodate a required feature, stop and propose a concrete scope revision; this plan does not permit silently dropping requirements.

## 16. Expected Demonstration and Documentation

Demo steps: load unsafe-query with a supplied input string → analyze → inspect tokens/AST/types/graph → select source-to-query finding → step analysis replay → inspect generated bytecode → Run and see simulated query event → replace with bound-query → analyze → show bound value remains tainted but no query-text finding → Run and see separate template/value event → demonstrate runtime error and cancellation on another synthetic example.

`docs/language.md` mirrors PRD grammar/typing with valid/invalid examples. `docs/bytecode.md` lists every opcode/stack effect and verifier. `docs/architecture.md` traces module calls and snapshots. `docs/testing.md` gives commands/fixtures; `docs/evaluation.md` links raw evidence/protocol. `docs/assignment_report.md` explains algorithms, finite-lattice termination, scope, graphs, runtime boundaries, results/limitations. `docs/demo_script.md` is a repeatable sequence with expected outputs.

No faculty template or submission time is invented. The Markdown report is ready to convert when faculty formatting is supplied; do not create a PDF/DOCX without its own instructions and QA workflow.

## 17. Backward Compatibility, Change Control, and Final Review

There is no existing executable/data migration. Preserve documentation history and repository remote. Version language/bytecode/protocol/report independently; reject incompatible values. Future changed behavior requires PRD change, decision entry, plan change, and user approval. Only implemented/tested behavior is documented as completed.

Before implementation approval: review this plan and PRD v0.3 together. Before each phase: read latest approved plan and context. After meaningful changes: update decision/status/handoff. Before release: verify exact requirements, type and source invariants, API completeness, states, cancellation, no hidden persistence/integrations, tests, limits/evidence, dependency lockfile, and clean repository.

All previous product-impacting decisions are resolved for this draft by explicit user answers or delegated exact specification. Remaining unknowns are delivery metadata (submission time/report template/teammate identity/demo hardware). No implementer may treat these as permission to alter product behavior. Newly discovered ambiguity is a stop-and-ask condition.

## 18. Planning Verification and Reference Provenance

During version 1.0 document drafting only: inspected local Node `26.5.0`, npm `11.17.0`, macOS `27.0`; queried official npm package metadata for the listed versions/engines/peers and Dagre types; verified GitHub action tag SHAs with `git ls-remote`. No dependencies were installed, no implementation/test/VM/benchmark/CI was executed, and nothing was pushed at that drafting stage. Subsequent publication authorization is recorded in the decision log.

Reference sources: [npm TypeScript metadata](https://registry.npmjs.org/typescript), [React Flow](https://reactflow.dev/api-reference/react-flow), [Dagre package metadata](https://registry.npmjs.org/@dagrejs%2fdagre), [Monaco](https://microsoft.github.io/monaco-editor/), [Web Worker termination](https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate), [checkout v6.0.2](https://github.com/actions/checkout/releases/tag/v6.0.2), [setup-node v6.4.0](https://github.com/actions/setup-node/releases/tag/v6.4.0), [upload-artifact v6.0.0](https://github.com/actions/upload-artifact/releases/tag/v6.0.0).
