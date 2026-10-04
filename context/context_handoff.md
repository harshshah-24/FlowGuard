# Context Handoff

## Project Context

The user is preparing an Innovative Assignment for **4CS501CC25 Principles of Compiler Design**. Submission requires a working project, source code, and documentation. They want a resume-worthy project that demonstrates core CS fundamentals and supports master's preparation.

## Current Artifacts

- `project_ideas.md`: Original topic proposals retained as history, with FlowGuard marked as selected.
- `flowguard_prd.md`: Draft product requirements for the selected visual input-flow analyzer.
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

FlowGuard analyzes possible explicit flow of untrusted input into modeled SQL query-text and shell-command operations. Proposed scope includes a custom language, a hand-built compiler front end, control-flow graph, worklist-based taint analysis, interactive explanations, a local graphical interface, and command-line parity. These are proposed requirements, not final architecture decisions.

Do not confuse FlowGuard with the original integer-range static analyzer. Interval analysis and division-by-zero checks are outside the proposed FlowGuard initial release. A highlighted graph route must not be called a proven executable exploit path.

## Workflow Requirements

- Give a very short pre-execution summary and wait for approval before changes.
- Write implementation plans in Markdown files, not chat.
- Make approved plans deterministic; stop for open decisions or deviations.
- Keep the project-state files synchronized with meaningful changes.
- Keep explanations simple and concise.

## Next Step

Review the PRD with the user. Resolve its planning inputs: custom-language scope, built-in models, course requirements, technology restrictions, deadline, team size, and delivery format. Then create a separate deterministic implementation plan for approval. Authorization to draft the PRD does not authorize implementation.
