# Context Handoff

**Updated:** 2026-10-08

## Source of Truth and Workflow

FlowGuard is the Innovative Assignment for 4CS501CC25 Principles of Compiler Design, team of two, deadline 8 October 2026. Harsh and Jyot are the teammates. Harsh confirmed Markdown report format. Exact submission time and required demo hardware remain unknown. Canonical sole repository: https://github.com/harshshah-24/FlowGuard, origin. Phases 2/3 were developed on codex/flowguard-build. Phases 2/3 are published on main as implementation commit 9b3e96c, fast-forwarded from f4c0aa9 (Phase 1 publication record); remote Phase 0/1 CI passed.

PRD v0.3 and master plan v1.3 define exact language, interfaces and limits. Phase files are synchronized task views; status and decision log track actual progress. Preserve history and supplied conventions. Implementation authorization does not imply commit/merge/push authorization. Stop and ask for unresolved contract choices; do not silently change requirements or call partial work complete.

No backend, accounts, persistence, autosave, real SQL/shell effects, new dependencies or project license. Core is portable TypeScript; Node/browser adapters provide hashing, clocks and I/O. Drafts live in memory; saves/exports are explicit. Use concise chat and detailed evidence in documents.

## Authorization and State

Phases 0–3 are published; current base is publication record `3a7678c` and implementation `9b3e96c`. Harsh explicitly approved Phase 4 and confirmed Markdown for the report. Phase 4 technical preparation is local on `codex/flowguard-build`; Harsh explicitly approved commit/merge/push on 8 October; publication is in progress. Do not overwrite teammate changes. Human rehearsal by Harsh and Jyot and new remote CI remain release gates.

Read [status](status_update.md), [Phase 4 handoff](phase_4_agent_handoff.md), [acceptance](../docs/acceptance.md), [evaluation](../docs/evaluation.md), [report](../docs/assignment_report.md) and [demo](../docs/demo_script.md) for exact remaining actions.

## Actual Implementation

The front end and typed CFG are extended by finite FIFO explicit may-taint, exact overwrite/union transfers, converged findings, bounded cycle-safe provenance and reversible replay/checkpoints. Literal structural alternatives remain; implicit control flow is excluded. A bound value alone is not query-text taint. Final states and analysis replay are separate views.

Analyze now finishes all nine stages through codegen/verify. Final findings/bytecode/disassembly publish only after verification; failures keep safe completed artifacts. Codegen maps each emitted PC to IR/AST/span, deduplicates typed constants, patches target starts and preserves static source identities. Verifier checks strict envelopes/operands/types, stack-flow joins and greatest-fixed-point definite initialization using bounded bitsets; it checks LOAD only after convergence and caps both passes.

VM reverifies on entry, consumes bounded supplied inputs in encounter order, uses BigInt for exact checked int32 arithmetic and runs lowered short circuit/loops. Slots and stack retain typed scalars. SQL/query/binding/shell are simulated events; output is capped before retaining an event. Runtime errors/limits preserve prior events. HALT is the only successful termination. Compile/runtime deadlines and all fixed caps are unchanged.

Browser analysis, execution and layout workers are separate and bundled locally. Clients validate identity/schema, terminate/recreate and accept one terminal outcome. Analysis watchdog 10250 ms; execution 1250 ms; layout 2000 ms. Source/input edits retire execution; stale/duplicate results cannot update current state. Run requires current completed bytecode and valid JSON string-array inputs. Bytecode PC selection links graph/source; runtime/input/bytecode views paginate. A stabilized React Flow selection callback prevents feedback loops. Ctrl/Cmd+Enter analyzes; Stop cancels runtime and preserves static results.

CLI shares the core and supports strict flags, bounded fatal UTF-8 reads, no-clobber output, explicit overwrite, reports, trace, --run and --inputs. Failed runtime reports retain static analysis. Exit codes 0/1 success without/with findings, 2 invalid source/request/input file, 3 runtime/internal/limit/output, 130 cancellation. The executable keeps main-thread SIGINT handling responsive via a worker and a shared atomic cancellation flag. Browser termination/watchdog results cannot recover events from a killed worker; core-reported runtime failures retain preceding events.

## Approved Scope Contract and Continuation

The user approved the proposed contract addition with "go ahead". Required topLevelSymbolIds now carries final HALT visible symbols in symbol order. Schema/verifier checks its cap, uniqueness/order and user-slot references. The VM projects initialized values after completion or core-reported failure/cancellation; unverified requests expose no values. Locals, temporaries and declarations not reached are omitted. Contract fixtures and scope-specific core/CLI/browser tests are updated and passing. Master plan v1.3 and phase/status/architecture/language records are synchronized.

Phase 4 preserves this contract. Its only product changes are accurate header/footer status messaging and visible analysis cancellation. Evaluation/benchmark/demo scripts use the real core and production bundle; CI gains deterministic evaluation, not hardware-sensitive timing. No dependency, target or resource-cap amendment was needed.

## Validation and Environment

Fresh npm installation, typechecks, 260 unit/CLI tests and production builds passed on this Mac. Final browser/evaluation results are recorded in docs/testing.md. Evaluation gives TP6/FP2/FN0/TN4, invalid8/incomplete0 and zero expectation/attribution mismatches; two infeasible structural alarms are explicitly included. All approved performance targets passed: engine p95 938.8ms, graph readiness1282.5ms, selection34.9ms, visible cancellation below13ms. Exact raw samples/limits/source hashes and hardware are in docs/evidence. Screenshots use synthetic Ada input and were visually inspected. Current audit found zero vulnerabilities.

Use Node26.5.0/npm11.17.0 via `.nvmrc`/packageManager; old Windows TEMP toolchain paths are historical and do not apply to this Mac. `npm run check` covers functional checks plus labeled evaluation. `npm run benchmark` requires the built production preview on4173; do not run heavy tests simultaneously. `npm run build:scripts` compiles into ignored `.vite/scripts`; `node .vite/scripts/capture-demo.js` regenerates actual synthetic screenshots against the preview. Raw evidence records dirty source based on3a7678c and individual source checksums, not a fabricated publication commit.

Normal builds exclude the test-only phase2 harness; its isolated build uses4174. Test suites manage their own servers, so stop a manual4173 preview before running them. Vite's main chunk remains3.50MB/~0.925MB gzip; measured targets passed, cold-load performance is unspecified.

[Remote CI run37660826256](https://github.com/harshshah-24/FlowGuard/actions/runs/37660826256) passed for published implementation9b3e96c and was verified during Phase 4. No new Phase 4 remote CI exists before push. Complete the human rehearsal and publication/submission gates honestly. All work remains in the canonical repository; no subagents, real SQL/shell effects, persistence, license, deployment or faculty submission were added.
