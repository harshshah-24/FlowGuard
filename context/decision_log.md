# Decision Log

## 2026-10-04 — Record three compiler-design project proposals

- The user requested resume-worthy assignment ideas that demonstrate core CS fundamentals and support master's preparation.
- The user approved creating `project_ideas.md` containing all three proposals.
- Recorded a small compiler and virtual machine, an optimizing compiler, and a static analyzer using abstract interpretation.
- Recommended the compiler and virtual machine for broad coverage; the other proposals emphasize optimization and correctness respectively.
- No topic, implementation language, architecture, or implementation plan has been approved.
- This stage is documentation only. Implementation requires topic selection and an approved deterministic plan.

## 2026-10-04 — FlowGuard selected and PRD drafted

- The user selected the third idea from the later visual-project suggestions: FlowGuard — Visual Static Analyzer for Unsafe Input Flow.
- The user approved updating the project-state documents and requested a PRD.
- FlowGuard adds an interactive control-flow graph and explanations of untrusted input reaching sensitive operations.
- The selected direction is taint analysis, not the integer-range analyzer in the original ideas file. Original proposals are preserved as history.
- Created `flowguard_prd.md` with proposed scope, compiler fundamentals, user experience, acceptance criteria, evaluation, and submission deliverables.
- Requirements and technical choices in the PRD remain draft proposals. No implementation plan or prototype is approved or implemented.
- Deadline, team size, course constraints, technology choices, and acceptance of the proposed custom-language scope remain planning inputs.

## 2026-10-05 — Canonical repository and initial documentation setup

- The user designated `https://github.com/harshshah-24/FlowGuard` as the sole repository for all FlowGuard work.
- The user approved updating the README, adding a context folder, and pushing the initial documentation to `main`.
- Preserved the remote's existing initial README commit and based local `main` on `origin/main`.
- Moved all five project documents into `context/` and added a context index.
- Updated the root README to distinguish the proposed tool from the current documentation-only state.
- Added a minimal `.gitignore` for macOS metadata, local environment values, and editor temporary files. Stack-specific entries remain pending stack approval.
- Repository preparation does not approve the PRD or authorize prototype implementation.
- Initial documentation commit `c30f8f5` was successfully pushed to `origin/main`; no existing history was overwritten.

## 2026-10-05 — PRD expanded to cover technical and product behavior

- The user supplied detailed PRD requirements, approved the edits, and explicitly authorized pushing the updated documentation to `main`.
- Revised `flowguard_prd.md` to version 0.2 with component responsibilities, internal processing, models/contracts, request/result behavior, UI flows/states, permissions, security, configuration, performance, deployment, testing, and traceable acceptance criteria.
- Distinguished proposed required behavior from implementation recommendations, assumptions, and unresolved decisions. Document publication does not approve these technical choices or authorize implementation.
- Recommended a shared TypeScript engine, browser worker, React interface, and Node.js CLI; these are unapproved recommendations, not selected dependencies.
- Explicitly recorded that no database or account service is required under the proposed stateless local architecture. A local-backend alternative remains decision-gated.
- Identified the dynamic SQL placeholder-checking gap and the effects of short-circuit semantics and variable initialization. These must be resolved before the affected implementation starts.
- Added an open-decision register (OD-01–09), recommended measurable budgets, and a documented consistency review. No runtime claims or implementation code were added.
- The user replaced the earlier workflow instructions with explicit PRD rules: PRDs define product behavior, and approved implementation plans define implementation. Updated the handoff accordingly; the existing authorization to edit and push documentation remains in effect.

## 2026-10-05 — Scope decisions resolved and implementation plan drafted

- The user approved the custom typed language, TypeScript/Node/React/browser-worker stack, handwritten front end, literal placeholder checking with nonblocking dynamic-template uncertainty, memory-only storage, and proposed main limits. No faculty language/tool restrictions were reported.
- The user delegated exact grammar/arithmetic, contract conventions, and remaining resource bounds. PRD v0.3 specifies these for review; the implementation plan defines exact interfaces and algorithms.
- The faculty does not require code generation, but the user explicitly chose to add it. On follow-up, the user selected both bytecode generation and a VM that executes it; generation-only was not selected.
- Revised the earlier no-execution boundary: Analyze never runs source; explicit Run executes verified custom bytecode in an isolated bounded interpreter. SQL and shell operations still produce simulated events only.
- The user confirmed two teammates, deadline 8 October 2026, GitHub Actions checks, and no project license. Submission time/report template/demo hardware were not specified.
- Selected under delegation: signed-32-bit checked arithmetic, initialized declarations, no shadowing/coercions, short-circuit lowering, UTF-16 source spans, deterministic IDs, JSON/Markdown reports, typed stack bytecode/verifier, supplied-input VM, and additional bounded storage limits.
- Prepared `implementation_plan.md` with exact files, models, module interfaces, algorithms, worker/UI/CLI behavior, pinned dependencies/action references, tests, phase gates, and suggested ownership/schedule.
- Verified dependency metadata and local runtime versions only. No packages were installed; no prototype, tests, CI, VM, or benchmark were executed.
- Current document edits remain uncommitted/unpushed. The user specifically requested a short overview and permission before pushing the finished documents. Plan approval and implementation authorization are also pending.

## 2026-10-05 — Separate phases and documentation publication authorized

- The user explicitly requested pushing the prepared documents and splitting/pushing the implementation plan into separate phases.
- Added `context/phases/README.md` and five phase files covering foundation, front end/lowering, analysis/explanations, codegen/VM, and release validation.
- Master plan v1.1 remains the shared technical specification. Phase files are synchronized execution views with ordered tasks, ownership, dependencies, validation, and exit gates.
- Clarified the phase dependency: static-module validation occurs in Phase 2, while a completed public Analyze result and full browser demonstration require Phase 3 codegen/verifier. No public result-contract or product-scope change was made.
- Updated README/context navigation and project-state files. Publishing documentation is authorized; building/installing dependencies is not yet authorized.

- Publication completed: documentation commit `ede7f05` pushed successfully to canonical `origin/main`; implementation remains unstarted.

## 2026-10-05 — Phase 0 implemented locally

- The user requested Phase 0 implementation and approved the stated scope before changes. Created the planned `codex/flowguard-build` branch. No later phase is authorized or implemented.
- Added exact pinned npm workspaces/lockfile, TypeScript configurations, CI scaffold, complete analysis/execution model schemas, source utilities, diagnostics, fixed budget guards, synthetic examples/fixtures, pure workspace reducer, and editable React foundation shell.
- Analysis/Run controls are disabled and CLI analysis/execution is unavailable; empty-program data is hand-authored schema test input only, never a claimed compiler result.
- Clean `npm ci --no-audit --no-fund` succeeded. Local typecheck, 28 Vitest tests, ESM/Vite build, and two production Chromium tests passed. Screenshot inspected. No remote CI or compiler/VM/evaluation/benchmark was executed.
- `npm audit --json` reported two low-severity Monaco/DOMPurify entries (GHSA-p98j-92pf-mc4p), no moderate/high/critical entries. Monaco is not integrated or bundled in this phase. Retained the approved pins; review mitigation before Phase 1 Monaco integration.
- Source-location helpers use portable WHATWG Encoding globals with structural type declarations; core builds without DOM/Node type libraries. No backend/database/accounts/persistence/project license was added.
- Implementation changes remain local; any push/merge needs the applicable user authorization.

## 2026-10-05 — Phase 0 publication approved

- The user explicitly approved merging and pushing Phase 0 to `main`.
- Verified remote main remained `2a5c687`, fast-forwarded main to `565b47c`, and successfully pushed to the sole canonical repository. No history was overwritten.
- Remote CI passed for implementation commit `565b47c`: clean install, typechecks, 28 unit tests, production build, and two Chromium checks. Evidence: https://github.com/harshshah-24/FlowGuard/actions/runs/37237405149. Later phases remain unauthorized.

## 2026-10-05 — Phase 1 and dependency mitigation approved

- User approved Phase 1 implementation, then explicitly approved the Monaco-scoped exact DOMPurify 3.4.16 override after reviewing the advisory. Keep Monaco 0.57.0.
- Update the approved plan and lockfile before integration, verify the audit and production editor assets. Phase 1 source push remains subject to separate approval.

## 2026-10-05 — Phase 1 completed locally

- Implemented the approved handwritten lexer/parser, source-order scope/type checker, and typed instruction lowering/CFG validation. AST IDs are preorder; input IDs sort by source position; structural branches and loop back edges are preserved.
- Added shared internal iterative AST traversal. Fixed the foundation schema gap: AST validation now honors the total-node budget without an extra 512-level transport cap, and retains wrong-arity effect arguments for semantic diagnostics. No language/product contract changed; master plan and phase view are synchronized.
- Integrated bundled Monaco API, suggestion/find/highlight contributions and local editor worker. Original source remains independent of Monaco's BOM stripping/newline normalization; edit ranges and markers use original line indexes. Added file/snapshot/download adapters, examples/help, loading/error feedback, dirty replacement dialog, beforeunload and keyboard behavior.
- Added SOURCE_SAVED revision bookkeeping so only the actually downloaded revision becomes clean. Download initiation cannot guarantee a file was saved to disk. Draft recovery/history/persistence remain excluded.
- Clean lockfile install and final `npm run check` passed: 111 unit tests, six production Chromium checks, typechecks and builds. The patched Monaco-scoped DOMPurify 3.4.16 installs correctly; audit reported zero vulnerabilities. Vite's Monaco chunk warning is recorded; no benchmark/performance claim is made.
- Full Analyze, security findings, graph presentation, codegen/verifier/VM and CLI analysis remain later work. Phase 1 publication and Phase 2 require separate user approval; no push occurred.

## 2026-10-05 — Phase 1 publication completed

- User explicitly requested pushing Phase 1 to main. Fetched the sole canonical origin and verified main remained `581e246`; fast-forwarded and pushed implementation commit `ed9f952` without overwriting history.
- [GitHub Actions run 37274679542](https://github.com/harshshah-24/FlowGuard/actions/runs/37274679542) passed: clean install, typechecks, 111 unit tests, production builds, and six Chromium tests.
- Publication/status/plan/phase/handoff records synchronized. Phase 2 remains unauthorized.

## 2026-10-07 — Phase 2 implementation authorized and completed locally

- User explicitly instructed: "go ahead and fully implement phase 2". This authorizes the Phase 2 work and necessary installation/validation, not Phases 3/4 or publication.
- Created the planned codex/flowguard-build branch from published main f4c0aa9. No commit, merge or push was performed.
- Implemented finite FIFO explicit may-taint, exact transfers/joins/overwrite, storage/work/time/cancellation caps, independently labeled converged sink/source units, bounded final-state provenance/cycle markers, and reversible count/byte-bounded replay.
- Added the static-stage coordinator, capped versioned JSON/Markdown reports, strict CLI/file/output adapters, and bundled validated analysis/layout workers/clients with independent identities, cancellation, watchdogs and fallback.
- Integrated view-only React Flow/Dagre graph/list, source-linked finding/graph selection, expandable/paginated inspectors, explicit final-versus-replay state modes, reduced-motion replay controls and current/previous snapshot exports.
- Preserved existing completion contracts. Until Phase 3, the coordinator explicitly returns incomplete internal-error/ENGINE_INTERNAL at missing codegen; no final findings/bytecode/disassembly are published. Analyze/Run remain disabled in the normal browser; valid static CLI input returns incomplete report/exit 3. Real module findings are verified in a separate labeled test-build harness absent from normal production output.
- Exact approved Node 26.5.0/npm 11.17.0 were temporarily installed after checksum verification because the Windows system runtime was Node 22.16.0/npm 11.6.2. System runtime and dependency pins/lockfile were unchanged. Locked installation succeeded; npm audit reported zero vulnerabilities.
- Full check passed: 180 unit/CLI tests, six production Chromium tests, four real-static integration Chromium tests, typechecks and builds. Both synthetic screenshots were inspected. Final focused refinement checks are recorded in docs/testing.md. Phase 2 remote CI/evaluation/benchmarks/VM have not run.
- Updated implementation/phase/status/handoff, README, language/architecture/testing/third-party documentation. Phase 2 publication remains pending separate authorization; Phases 3/4 remain unauthorized.

## 2026-10-07 — Phase 3 authorized; implementation awaiting final scope contract

- User explicitly requested "go ahead and implement phase 3 as well". Phase 4 and publication remain unauthorized.
- Implemented typed generation/disassembly, strict stack-flow and greatest-fixed-point initialization verification, complete Analyze, bounded typed VM, CLI --run/inputs/status precedence and responsive worker-based SIGINT handling.
- Integrated separate execution worker/client/watchdog, current-source Run/Stop gating, bytecode selection, input validation, runtime events/reports and cancellation on edit. Fixed graph selection feedback discovered by production tests.
- All local checks passed: 249 unit/CLI tests, ten production Chromium checks, four isolated integration checks, typechecks and builds. Independent runtime fixtures and synthetic inspected screenshot are recorded in docs/testing.md. No benchmark, evaluation, remote CI, commit or push was performed.
- Identified a contract gap: bytecode slots omit lexical scope membership, but finalTopLevelValues must exclude locals/temporaries. Proposed explicit topLevelSymbolIds derived from final IR HALT visibility; requested approval under the master plan's stop-and-ask rule. That field has not been added; finalTopLevelValues remains empty. Phase 3 exit gate remains open.

## 2026-10-07 — Scope metadata approved; Phase 3 completed locally

- User answered "go ahead" to the concrete proposal for topLevelSymbolIds. Added the required bounded, unique, ordered user-symbol metadata, derived from final HALT visibility; synchronized master plan v1.3 and affected contracts/phases.
- VM now projects initialized top-level values in symbol order after completed or core-reported failed/cancelled runs. Locals, temporaries, unreached declarations and unverified metadata do not appear.
- Final npm run check passed: 260 unit/CLI tests, eleven production Chromium checks, four isolated integration checks, typechecks and production builds. Scope checks include malformed metadata, runtime failure/limit/cancellation, CLI reports and real browser workers/exports. Synthetic final screenshot regenerated and inspected.
- Phase 3 exit gate is complete locally. Changes remain uncommitted/unpushed; publication and Phase 4 require applicable authorization. No benchmark, release evaluation or remote CI was run.

## 2026-10-07 — Publication and teammate Phase 4 continuation authorized

- User explicitly requested: "push all this so I can let my teammate know that he can continue with phase 4 with his coding agent".
- Verified sole canonical origin and fetched remote main; it remains f4c0aa9, matching the implementation branch base. Publish completed Phases 2/3 by fast-forward, without rewriting remote history.
- Added context/phase_4_agent_handoff.md with the authorized continuation, source-of-truth reading order, pinned setup/baseline commands, missing evaluation/benchmark scripts and remaining release evidence. Phase 4 is authorized for teammate continuation but has not been executed here.
- Current implementation has passed the full local check (260 unit/CLI, eleven production Chromium and four static-integration checks, typechecks/builds). Verify the real publication commit's remote CI separately; do not infer it from local checks.

## 2026-10-07 — Phases 2/3 published; implementation CI passed

- Committed Phases 2/3 implementation, tests/docs and concrete Phase 4 teammate handoff as 9b3e96c. Fast-forwarded main from verified f4c0aa9 and pushed to the sole canonical origin; no remote history was overwritten.
- Verified [GitHub Actions run 37660826256](https://github.com/harshshah-24/FlowGuard/actions/runs/37660826256) completed with success for 9b3e96c. Clean installation, typechecks, unit/CLI tests, builds, production Chromium and static integration suites all passed on Ubuntu.
- Publishing this documentation-only record of commit/CI/handoff under the user's current push authorization. Teammate Phase 4 continuation is authorized and remains unstarted; use context/phase_4_agent_handoff.md. Subsequent Phase 4 publication needs applicable authorization.

## 2026-10-07 — Phase 4 approved

- Harsh explicitly approved Phase 4 implementation and validation in this chat. Jyot is the confirmed second teammate.
- Preserve latest PRD/master v1.3, pinned dependencies, fixed resource/performance targets, no license, simulated effects and memory-only drafts. Publication requires separate approval.
- Fix independent evaluation labels before running predictions; known infeasible structural alarms remain false positives in applicable counts. No benchmark or release completion is claimed yet.

## 2026-10-07–08 — Phase 4 evidence and Markdown delivery

- Harsh answered "prepare in markdown". Report, demo and supporting documentation remain Markdown; no faculty template, exact submission time or required demo machine is invented.
- Completed independent fixed-label evaluation with TP6/FP2/FN0/TN4, invalid8/incomplete0 and zero expectation/attribution mismatches. Both infeasible structural alarms remain false positives in the headline counts and a separate subset; no accuracy claim is generalized beyond these educational fixtures.
- Fixed-seed20-workload benchmarks and real200-node browser graph passed all approved targets unchanged. Raw source hashes, machine/versions, warm-up, ten samples and nearest-rank p95 are retained. Local dirty-source provenance based on3a7678c is explicit.
- Corrected obsolete footer/header wording and exposed visible analysis cancellation. Added production release edge-case coverage and deterministic evaluation to local check/CI. No dependencies, schema, hard caps, targets or runtime effects changed.
- Early browser checks caught obsolete assertions and cancellation/graph-size fixture races; corrected test fixtures instead of relaxing product limits. Actual replay-byte truncation is now checked with usable final states.
- Prepared actual sample reports and inspected synthetic screenshots, bytecode reference, assignment report, acceptance mapping and demo script. Current audit reports zero vulnerabilities.
- Phase 4 publication/new remote CI and both human rehearsals remain gates. Technical readiness is not faculty submission. No commit/merge/push/deployment was performed under implementation-only approval.

Final npm run check completed with exit0 on8October:260 unit/CLI,15 production Chromium,4 isolated Chromium, typechecks, production builds and deterministic evaluation. No further implementation changes followed. Phase4 remains local pending publication approval.

## 2026-10-08 — Phase 4 publication authorized

Harsh answered "yes" to the explicit request to commit and push Phase 4 to main. Fetched canonical origin and verified origin/main exactly matches the local base3a7678c. Publish by fast-forward without force-push, then verify the new implementation commit in GitHub Actions. Human rehearsal and faculty submission remain separate actions.

## Phase 4 publication and remote validation — 8 October 2026

Harsh explicitly approved publication. Implementation/evidence commit `164b94a` was fast-forwarded from `3a7678c` and pushed to canonical main without rewriting history. [GitHub Actions run 37669529758](https://github.com/harshshah-24/FlowGuard/actions/runs/37669529758) completed successfully for `164b94acd7d77681af46c80306b76cd2750ce513`: clean installation, typechecks, unit/CLI tests, production builds, deterministic evaluation, production Chromium and isolated integration checks. This is actual remote evidence, separate from local measurements. Human rehearsal and faculty submission remain unrecorded. A documentation-only follow-up publishes this verified record.
