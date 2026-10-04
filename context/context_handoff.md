# Context Handoff

## Project Context

The user is preparing an Innovative Assignment for **4CS501CC25 Principles of Compiler Design**. Submission requires a working project, source code, and documentation. They want a resume-worthy project that demonstrates core CS fundamentals and supports master's preparation.

## Current Artifacts

- `project_ideas.md`: Original topic proposals retained as history, with FlowGuard marked as selected.
- `flowguard_prd.md`: Version 0.2 detailed draft requirements, internal behavior, interfaces, states, acceptance criteria, and open decisions for the visual input-flow analyzer.
- `decision_log.md`: Decisions and authorization recorded so far.
- `status_update.md`: Current progress and next steps.

All five documents above now live in `context/`. `context/README.md` provides a reading guide. The root `README.md` describes the project and links to these documents; the root `.gitignore` excludes basic local-only files.

## Repository

- Canonical and sole authorized repository: `https://github.com/harshshah-24/FlowGuard`.
- Remote name: `origin`; working branch: `main`.
- Preserve the existing remote history. Never force-push or switch to another repository without user authorization.
- The user approved the initial documentation push to `main`. Implementation remains pending requirements and plan approval.
- Initial documentation commit `c30f8f5` was pushed successfully. README, PRD, exploration history, and project-state documents are stored in the canonical repository.

## Current State

The user selected FlowGuard, the third idea from the later suggestions emphasizing impressive visuals and a distinctive use case. They approved project-state updates and requested a PRD. The PRD is now drafted. No implementation has started; neither the PRD requirements nor an implementation plan has been approved.

The user subsequently approved expanding the PRD against their detailed product/technical checklist and pushing that revision to `main`. Version 0.2 is written and reviewed for document consistency. Editing/publication approval is not implementation approval.

The PRD separates required draft behavior, recommendations, assumptions, and open decisions. Its recommended browser-worker/shared-TypeScript stack is not approved. There is no required application database, authentication service, or HTTP analysis API under that recommendation. Logical service/API boundaries still have explicit contracts.

Before implementation, resolve OD-01–09 in PRD section 19.2. Important gates include course fit, grammar/scope/initialization/boolean evaluation, dynamic `sql_bind` placeholder behavior, worker versus backend architecture, dependencies, span/schema/CLI conventions, persistence, resource budgets, and delivery constraints. Do not invent answers or treat performance targets as measured results.

FlowGuard analyzes possible explicit flow of untrusted input into modeled SQL query-text and shell-command operations. Proposed scope includes a custom language, a hand-built compiler front end, control-flow graph, worklist-based taint analysis, interactive explanations, a local graphical interface, and command-line parity. These are proposed requirements, not final architecture decisions.

Do not confuse FlowGuard with the original integer-range static analyzer. Interval analysis and division-by-zero checks are outside the proposed FlowGuard initial release. A highlighted graph route must not be called a proven executable exploit path.

## Workflow Requirements

- Give a very short pre-execution summary and wait for approval before changes.
- The user's replacement workflow requires detailed, self-contained PRDs as the single source of truth for product behavior; separate required behavior, recommendations, assumptions, and open decisions. Review technical behavior, flows, states, edge cases, dependencies, contradictions, and acceptance criteria before finishing.
- Write implementation plans in Markdown files, not chat.
- Translate the approved PRD into a deterministic implementation plan as the single source of truth for implementation. Stop and ask the user for unresolved implementation decisions or deviations; update the plan and project state after answers.
- Make approved plans deterministic; stop for open decisions or deviations.
- Keep the project-state files synchronized with meaningful changes.
- Keep explanations simple and concise.

## Next Step

Review PRD version 0.2 with the user and resolve OD-01–09. Then create a separate deterministic implementation plan for approval. Authorization to edit/publish the PRD does not authorize implementation.
