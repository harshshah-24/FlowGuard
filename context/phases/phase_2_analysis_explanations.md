# Phase 2 — Taint Analysis, Explanations, and Integration

**Suggested window:** 6 October 2026

**State:** Not started. Documentation publication is not implementation authorization.

## Source of Truth

[Master implementation plan](../implementation_plan.md) defines exact interfaces, files, versions, algorithms, and limits. [PRD](../flowguard_prd.md) defines product behavior. This file is an actionable phase view of that plan; it does not replace or override either document.

Master sections 7, 10–12, and report/CLI portions of section 13 are authoritative.

## Entry Gate

Phase 1 provides valid resolved symbols and typed instruction graphs.

## Ownership and File Scope

- **Teammate A:** taint.ts, findings.ts, provenance.ts, replay.ts, report.ts, coordinator/CLI analysis integration and engine tests.
- **Teammate B:** Analysis worker/client, layout worker/client, graph/list/nodes, findings/inspectors/replay/export, and state/race integration tests.

Full file paths and additional tests/docs are in master section 3. Shared contracts must not change without synchronizing the master plan and affected phases.

## Ordered Tasks

1. Implement finite source sets, immutable/copy-on-write states, conservative joins, FIFO membership-deduplicated scheduling, and exact transfer rules. Enforce state-cell/source-membership/work/time caps.
2. Compute final sink findings after convergence; group all sources by sensitive argument/rule and stable source order.
3. Build final-state dependency facts and cycle-safe bounded explanations. Preserve findings/source sets when provenance is truncated.
4. Record reversible deltas and bounded checkpoints; replay truncation must not interrupt the solver. Test recorded final state equivalence when complete.
5. Implement capped JSON/Markdown serializers and CLI flag/file/output handling for analysis. Keep any public completed outcome gated on all master-plan stages, including Phase 3 codegen/verifier.
6. Wire request identity, source revisions, progress, termination-based cancellation, retry, watchdogs, and stale-message rejection. Analysis and execution identities remain separate.
7. Wire node/finding selection, final states versus replay states, local Dagre layout, large-graph/error list fallback, and explicit current/previous snapshot exports.
8. Test static-stage results through internal module tests and labeled development/partial artifacts. Do not add a public static-only completed result or weaken the completed-result schema to bypass missing codegen.

## Required Validation

- [ ] Independently labeled direct/transitive/merge/overwrite/loop/multiple-source/binding fixtures produce correct states and sink units.
- [ ] Loop input identities remain finite; caps, cycle-safe provenance, and replay reconstruction behave correctly.
- [ ] Worker/reducer tests cover duplicates, late results, cancellation, source edits, invalid-source and partial stages.
- [ ] Graph fallback, source-linked inspection, report snapshot identity, and JSON/Markdown safety tests pass.
- [ ] The static unsafe-to-binding comparison passes in module/integration tests; the complete user-facing Analyze demo is deferred until Phase 3 adds bytecode/verifier.

## Exit Gate

Complete static-analysis modules and presentation integration before Phase 3. Keep the release result contract unchanged.

## State Updates and Continuation

Update [status](../status_update.md), [decision log](../decision_log.md), and [handoff](../context_handoff.md) with completed behavior, checks actually run, remaining issues, and next steps. Stop and ask for any unresolved choice or deviation from the approved plan.

Previous: [Phase 1](phase_1_frontend_lowering.md).

Next: [Phase 3](phase_3_codegen_vm.md).
