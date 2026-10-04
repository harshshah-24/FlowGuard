# Context Handoff

**Updated:** 2026-10-05

## Purpose

FlowGuard is the Innovative Assignment for 4CS501CC25 Principles of Compiler Design. The submission needs a working tool, source code, and documentation. The user wants core CS fundamentals, resume value, impressive visuals, and a distinctive use case.

## Repository and Documents

Canonical/sole repository: `https://github.com/harshshah-24/FlowGuard`; remote `origin`; current branch `main`. Preserve remote history; never force-push or use a different repository without authorization.

All context lives in `context/`:

- `flowguard_prd.md` v0.3: product behavior and approved/delegated specifications.
- `implementation_plan.md` v1.1: exact implementation files, contracts, algorithms, dependencies, tests, and phases.
- `phases/README.md` and five phase documents: actionable tasks/gates linked to the master specifications.
- `decision_log.md`: chronological decisions and approvals.
- `status_update.md`: current work, remaining tasks, and next steps.
- `project_ideas.md`: historical proposals, not current scope.
- `README.md`: context reading guide. Root README describes current documentation-only state.

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

## Current State and Authorization

PRD v0.3, master plan v1.1, five separate phase documents/index, README, and state files are prepared for the authorized publication. No implementation exists; no dependencies were installed; no compiler/VM/tests/CI/benchmarks were executed. Dependency/version/action metadata were checked read-only.

After reviewing the overview, the user explicitly authorized pushing these documents to the repository and requested splitting the implementation plan into separate phases and pushing them too. Documentation publication is authorized; implementation/build is not. Preserve the master plan as the shared technical source of truth and phase files as synchronized task views.

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

Complete the authorized documentation publication and verify local/remote main match. Next obtain explicit implementation/build approval. Read the phase index and start Phase 0 only after that authorization. Any newly discovered implementation ambiguity remains a stop-and-ask condition.
