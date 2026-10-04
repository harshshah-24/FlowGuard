# Implementation Phases

**Status:** Phase documents prepared for publication; implementation has not started.

The [master plan](../implementation_plan.md) is the implementation source of truth. These five phase files provide ordered tasks, ownership, dependencies, validation, and exit gates. Read the [PRD](../flowguard_prd.md) and current [status](../status_update.md) before starting.

## Execution Order

1. [Phase 0 — Contracts and Foundation](phase_0_foundation.md) — 5 October 2026.
2. [Phase 1 — Front End and Control-Flow Lowering](phase_1_frontend_lowering.md) — 5–6 October 2026.
3. [Phase 2 — Taint Analysis, Explanations, and Integration](phase_2_analysis_explanations.md) — 6 October 2026.
4. [Phase 3 — Code Generation, Verifier, and VM](phase_3_codegen_vm.md) — 7 October 2026.
5. [Phase 4 — Validation, Evidence, and Submission](phase_4_release_validation.md) — 7–8 October 2026.

## Rules

- Complete a phase gate before declaring its dependent phase complete.
- Preserve the shared contracts, product scope, and hard limits from the master plan.
- Publishing documents does not authorize implementation; obtain the relevant plan/build approval.
- Phase 2 tests static modules; complete user-facing Analyze success waits for Phase 3 codegen/verifier. No fake completed release result is permitted.
- Dates are suggested allocation against the 8 October deadline, not completed-work claims.
- Keep this index and phase files synchronized when the approved master plan changes.
