# Context Handoff

**Updated:** 2026-10-05

## Purpose

FlowGuard is the Innovative Assignment for 4CS501CC25 Principles of Compiler Design. The submission needs a working tool, source code, and documentation. The user wants core CS fundamentals, resume value, impressive visuals, and a distinctive use case.

## Repository and Documents

Canonical/sole repository: `https://github.com/harshshah-24/FlowGuard`; remote `origin`; implementation branch `codex/flowguard-build` (based on published main). Preserve remote history; never force-push or use a different repository without authorization.

All context lives in `context/`:

- `flowguard_prd.md` v0.3: product behavior and approved/delegated specifications.
- `implementation_plan.md` v1.2: exact implementation files, contracts, algorithms, dependencies, tests, and phases.
- `phases/README.md` and five phase documents: actionable tasks/gates linked to the master specifications.
- `decision_log.md`: chronological decisions and approvals.
- `status_update.md`: current work, remaining tasks, and next steps.
- `project_ideas.md`: historical proposals, not current scope.
- `README.md`: context reading guide. Root README describes the current Phase 1 implementation and setup.

PRD defines product behavior; the latest approved implementation plan defines implementation. Neither source may be silently contradicted.

## Latest User Decisions

- Use a custom language and TypeScript/Node.js/React/browser-worker stack, with our own lexer/parser. No faculty language/tool restrictions were reported.
- Language: strings, integers, booleans, initialized declarations, block scope, no shadowing/coercion, if/else/while, short-circuit operators.
- User delegated exact grammar/arithmetic, interfaces, source spans, CLI/report conventions, and remaining bounds. PRD/plan specify these for document review.
- Literal binding templates get one-placeholder validation; nonliteral templates get a nonblocking uncertainty notice while taint analysis continues.
- No database, accounts, autosave/history, or draft recovery; explicit saves/exports only.
- Main resource caps approved; additional retained-state/VM/output budgets specified under delegation.
- User explicitly added code generation AND VM execution. Do not reduce this to generation-only or silently revert to the earlier no-execution proposal.
- Analyze is static only; explicit Run executes verified custom bytecode in a bounded worker. SQL/shell effects always remain simulated and never call external services.
- Team size two; deadline 8 October 2026. CI approved via follow-up answer. Keep the repository without a project license.

## Published Phase 0 State and Authorization

PRD v0.3/master plan/phase files were published on main. The user then explicitly approved Phase 0 implementation. Phase 0 implementation commit `565b47c` is published on canonical main: pinned workspaces/lockfile/configurations, strict models/contracts for analysis and runtime, source/diagnostic/budget utilities, examples/fixture skeletons, a pure workspace reducer, React shell, and CI scaffold.

Local checks passed: typecheck, 28 unit tests, production builds, and two Chromium UI checks. Clean lockfile installation succeeded. Remote CI passed for implementation commit `565b47c` ([run](https://github.com/harshshah-24/FlowGuard/actions/runs/37237405149)). At that Phase 0 checkpoint, no real compiler/analysis/codegen/VM or performance benchmarks had run. Current Phase 1 checks are recorded below. Analysis and Run remain visibly disabled; CLI only provides version/unavailable scaffolding. See `docs/testing.md`.

After reviewing the overview, the user explicitly authorized pushing these documents to the repository and requested splitting the implementation plan into separate phases and pushing them too. Earlier documentation publication was authorized. The user subsequently explicitly approved merging and pushing Phase 0 to main. Phase 1 was separately approved afterward, as recorded below. Phases 2–4 remain unauthorized. Preserve the master plan as the shared technical source of truth and phase files as synchronized task views.

Earlier main revision `bb5d585` published PRD v0.2. The new version supersedes its unresolved scope/recommended stack and no-execution assumptions; history remains in Git.

## Workflow Requirements

- Give an extremely short pre-execution summary with crisp bullets and wait for approval before changes.
- After approval, complete the authorized task and its obvious necessary next steps.
- PRDs must be detailed/self-contained, explain internal behavior, and distinguish required behavior, choices, assumptions, and unresolved decisions.
- Implementation plans must be deterministic Markdown files; do not leave decisions for the implementer.
- If an approved plan has an unresolved decision or needs a deviation, stop and ask, then update plan/state after the answer.
- Keep decision log, handoff, and status synchronized with meaningful changes.
- Keep chat simple/concise; technical detail belongs in documents.

## Remaining Unknowns and Next Step

Submission time/report template, teammate names/skills, and demo hardware are unspecified. These do not change product architecture. Do not invent faculty requirements or a precise submission time. Use generic teammate A/B ownership and record the actual benchmark machine later.

Phase 0 is published on main. Remote Phase 0 CI passed. Phase 1 and the exact DOMPurify mitigation were separately approved and implemented; see the continuation below. Any newly discovered implementation ambiguity remains a stop-and-ask condition.

## Phase 1 continuation

User approved Phase 1 and the Monaco-scoped DOMPurify 3.4.16 override. Phase 1 is complete locally on `codex/flowguard-build`; source publication and later phases are not authorized.

Actual core exports: lex, Parser/parse, SemanticChecker/checkSemantics, Lowerer/lowerProgram, deriveEdges/adjacency/validateLoweredProgram. Internal ast.ts provides iterative traversal. Semantics returns diagnostics; lowering throws SourceFailure on a blocking diagnostic. No frontend pipeline produces a completed Analyze result or taint verdict.

Frontend includes self-hosted Monaco worker/contributions, exact-text/BOM/newline edit and marker mapping, file/snapshot/download adapters, useWorkspace, toolbar/status/examples/help/replace dialog. SOURCE_SAVED clears dirty only for a matching revision. Snapshot helper captures source/revision and rejects stale hashing; analysis worker integration is later. Browser drafts remain memory-only.

Validation: clean npm ci and npm run check passed (111 unit tests/ten files, six production Chromium tests, types/builds). Audit after the approved override reported zero vulnerabilities; no Phase 1 remote CI or benchmarks. Docs/testing.md records the Monaco chunk-size warning and exact validation boundary. docs/language.md describes implemented grammar/types/lowering/API behavior. Fixtures are independently specified expectations, not fabricated analyzer results.

Next ask for source publication approval; do not start Phase 2 until authorized. Then use the latest master plan v1.2 and Phase 2 document. Preserve the no-license/no-persistence/no-real-effects boundaries.
