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
