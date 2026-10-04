# Phase 3 — Code Generation, Verifier, and VM

**Suggested window:** 7 October 2026

**State:** Not started. Documentation publication is not implementation authorization.

## Source of Truth

[Master implementation plan](../implementation_plan.md) defines exact interfaces, files, versions, algorithms, and limits. [PRD](../flowguard_prd.md) defines product behavior. This file is an actionable phase view of that plan; it does not replace or override either document.

Master sections 8–11 and 13 fix bytecode, verification, runtime, transport, and CLI behavior.

## Entry Gate

Phase 2 static modules/contracts are complete; Phase 1 lowered IR is unchanged.

## Ownership and File Scope

- **Teammate A:** codegen.ts, verify.ts, vm.ts, complete analyze.ts, CLI --run/inputs/status handling, and bytecode/runtime fixtures.
- **Teammate B:** Execution worker/client, bytecode/runtime/input panels, current-snapshot Run/Stop gating and production integration flows.

Full file paths and additional tests/docs are in master section 3. Shared contracts must not change without synchronizing the master plan and affected phases.

## Ordered Tasks

1. Generate exactly the specified typed stack bytecode from IR, deduplicate typed constants, preserve input source table, patch PC targets, and map every instruction to source.
2. Implement bytecode schema/arity/type/reference validation, stack-flow verification, and fixed-point definite initialization. Check LOAD safety after convergence, not during an incomplete first iteration.
3. Complete the analysis coordinator through codegen/verifier. Completed result now includes verified artifact and disassembly; invalid/incomplete results cannot run.
4. Implement the VM with supplied input order, exact checked 32-bit arithmetic using widened BigInt calculation, short-circuit execution, scalar slots/stack, deterministic events, and HALT-only completion.
5. Enforce instruction/time/stack/string/retained-storage/event/input caps. Preserve preceding events on runtime error/limit; simulated effects never perform external calls.
6. Wire a fresh execution worker and separate watchdog. Require current completed bytecode and valid JSON string-array inputs before Run; edit/Stop invalidates active execution.
7. Complete CLI --run/--inputs and runtime-versus-finding exit precedence; exports include matching-snapshot runtime only.
8. Finish current-source unsafe-to-binding Analyze/Run demonstration with real compiler data, replacing development fixtures in release paths.

## Required Validation

- [ ] All opcode, target/source-map, stack/join/initialization, malformed-bytecode, and verifier-cap fixtures pass.
- [ ] Short-circuit skipped inputs, integer loops, overflow/division/remainder, exhaustion, and modeled SQL/shell/print events match expected behavior.
- [ ] Infinite/oversized-output programs return incomplete-limit without freezing UI or executing external services.
- [ ] CLI/runtime report schemas and statuses match browser outcomes; stale bytecode cannot run.
- [ ] Production build demonstrates real analysis, verified bytecode, explicit VM Run, Stop/retry, and the binding correction.

## Exit Gate

Complete all functional compiler/analysis/runtime paths before Phase 4. No functionality may still depend on unlabeled mock data.

## State Updates and Continuation

Update [status](../status_update.md), [decision log](../decision_log.md), and [handoff](../context_handoff.md) with completed behavior, checks actually run, remaining issues, and next steps. Stop and ask for any unresolved choice or deviation from the approved plan.

Previous: [Phase 2](phase_2_analysis_explanations.md).

Next: [Phase 4](phase_4_release_validation.md).
