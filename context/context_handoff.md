# Context Handoff

**Updated:** 2026-10-07

## Source of Truth and Workflow

FlowGuard is the Innovative Assignment for 4CS501CC25 Principles of Compiler Design, team of two, deadline 8 October 2026. Exact submission time/template/teammate identities/demo hardware are unknown. Canonical sole repository: https://github.com/harshshah-24/FlowGuard, origin. Phases 2/3 were developed on codex/flowguard-build. Phases 2/3 are published on main as implementation commit 9b3e96c, fast-forwarded from f4c0aa9 (Phase 1 publication record); remote Phase 0/1 CI passed.

PRD v0.3 and master plan v1.3 define exact language, interfaces and limits. Phase files are synchronized task views; status and decision log track actual progress. Preserve history and supplied conventions. Implementation authorization does not imply commit/merge/push authorization. Stop and ask for unresolved contract choices; do not silently change requirements or call partial work complete.

No backend, accounts, persistence, autosave, real SQL/shell effects, new dependencies or project license. Core is portable TypeScript; Node/browser adapters provide hashing, clocks and I/O. Drafts live in memory; saves/exports are explicit. Use concise chat and detailed evidence in documents.

## Authorization and State

The user authorized Phase 2 and then said "go ahead and implement phase 3 as well" on 7 October. Phase 2 is complete. Phase 3 is complete locally, including the separately approved top-level scope metadata amendment below. The user then requested pushing all completed work so the teammate can continue Phase 4 with a coding agent. Phases 2/3 are now published as 9b3e96c; teammate Phase 4 continuation is authorized. Phase 4 remains unstarted; follow [phase_4_agent_handoff.md](phase_4_agent_handoff.md). Do not overwrite others' local work or infer authorization to publish future Phase 4 changes.

## Actual Implementation

The front end and typed CFG are extended by finite FIFO explicit may-taint, exact overwrite/union transfers, converged findings, bounded cycle-safe provenance and reversible replay/checkpoints. Literal structural alternatives remain; implicit control flow is excluded. A bound value alone is not query-text taint. Final states and analysis replay are separate views.

Analyze now finishes all nine stages through codegen/verify. Final findings/bytecode/disassembly publish only after verification; failures keep safe completed artifacts. Codegen maps each emitted PC to IR/AST/span, deduplicates typed constants, patches target starts and preserves static source identities. Verifier checks strict envelopes/operands/types, stack-flow joins and greatest-fixed-point definite initialization using bounded bitsets; it checks LOAD only after convergence and caps both passes.

VM reverifies on entry, consumes bounded supplied inputs in encounter order, uses BigInt for exact checked int32 arithmetic and runs lowered short circuit/loops. Slots and stack retain typed scalars. SQL/query/binding/shell are simulated events; output is capped before retaining an event. Runtime errors/limits preserve prior events. HALT is the only successful termination. Compile/runtime deadlines and all fixed caps are unchanged.

Browser analysis, execution and layout workers are separate and bundled locally. Clients validate identity/schema, terminate/recreate and accept one terminal outcome. Analysis watchdog 10250 ms; execution 1250 ms; layout 2000 ms. Source/input edits retire execution; stale/duplicate results cannot update current state. Run requires current completed bytecode and valid JSON string-array inputs. Bytecode PC selection links graph/source; runtime/input/bytecode views paginate. A stabilized React Flow selection callback prevents feedback loops. Ctrl/Cmd+Enter analyzes; Stop cancels runtime and preserves static results.

CLI shares the core and supports strict flags, bounded fatal UTF-8 reads, no-clobber output, explicit overwrite, reports, trace, --run and --inputs. Failed runtime reports retain static analysis. Exit codes 0/1 success without/with findings, 2 invalid source/request/input file, 3 runtime/internal/limit/output, 130 cancellation. The executable keeps main-thread SIGINT handling responsive via a worker and a shared atomic cancellation flag. Browser termination/watchdog results cannot recover events from a killed worker; core-reported runtime failures retain preceding events.

## Approved Scope Contract and Continuation

The user approved the proposed contract addition with "go ahead". Required topLevelSymbolIds now carries final HALT visible symbols in symbol order. Schema/verifier checks its cap, uniqueness/order and user-slot references. The VM projects initialized values after completion or core-reported failure/cancellation; unverified requests expose no values. Locals, temporaries and declarations not reached are omitted. Contract fixtures and scope-specific core/CLI/browser tests are updated and passing. Master plan v1.3 and phase/status/architecture/language records are synchronized.

The full npm run check passed. Phase 3 has no remaining functional gate. Pull latest canonical main, including published implementation 9b3e96c, and verify current CI. The teammate's coding agent may proceed with authorized Phase 4 evaluation, benchmarks and submission preparation from the published main; follow the concrete handoff and phase plan. Preserve fixed limits and report measured evidence separately from plans.

## Validation and Environment

Typechecks/builds, 260 unit/CLI tests, eleven production Chromium tests and four isolated static-integration Chromium tests passed locally. Runtime fixtures are independently specified in fixtures/runtime/manifest.json. The synthetic production binding/run screenshot test-results/phase-3-binding-run.png was inspected. [GitHub Actions run 37660826256](https://github.com/harshshah-24/FlowGuard/actions/runs/37660826256) passed for implementation commit `9b3e96c`: clean install, typechecks, unit/CLI tests, production build and both Chromium suites on Ubuntu. Phase 4 evaluation, benchmarks and submission artifacts have not run.

Use exact Node 26.5.0/npm 11.17.0 at TEMP/flowguard-toolchain/node-v26.5.0-win-x64 by prefixing PATH. It is the existing checksum-verified temporary toolchain; system Node22/npm11.6 was not upgraded. Dependencies/lockfile are unchanged. Vite's ~3.50 MB main chunk warning persists; no performance target is claimed.

Normal production builds exclude the clearly labeled test-only phase2 harness. npm run test:phase2 builds it into ignored .vite/phase2-dist on loopback4174; production tests use4173. Windows Chromium tests need normal process permissions. All work stays inside this workspace; no additional subagents were used.
