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
