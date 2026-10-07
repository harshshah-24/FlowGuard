# Phase 4 — Validation, Evidence, and Submission

**Suggested window:** 7–8 October 2026

**State:** Harsh approved implementation in this chat. Technical work and measured evidence are published as `164b94a` on main; release/submission exit gate remains open for human rehearsal and faculty submission. Actual CI evidence is recorded below. Markdown format is confirmed. See current [status](../status_update.md).

## Source of Truth

[Master implementation plan](../implementation_plan.md) defines exact interfaces, files, versions, algorithms, and limits. [PRD](../flowguard_prd.md) defines product behavior. This file is an actionable phase view of that plan; it does not replace or override either document.

Master sections 14–18 and PRD AC-01–17 define the release evidence.

## Entry Gate

Phases 0–3 pass their completion gates.

## Ownership and File Scope

- **Teammate A:** Core/CLI regression, independent evaluation, benchmarking, language/bytecode/architecture explanations.
- **Teammate B:** Browser/security/accessibility/race checks, clean setup/CI, screenshots/demo/report assembly; both rehearse.

Full file paths and additional tests/docs are in master section 3. Shared contracts must not change without synchronizing the master plan and affected phases.

## Ordered Tasks

1. Run typecheck, engine/CLI tests, production build, and Chromium end-to-end checks on the actual bundled workers/assets.
2. Execute dirty-source/file/export/empty/invalid/cancelled/stale/race/layout/truncation/runtime boundary cases and text-only rendering/no-network checks.
3. Run independently labeled fixture evaluation, recording counting unit, confusion counts, applicable precision/recall, and separate invalid/incomplete totals.
4. Benchmark the approved bounded workloads with fixed seed/checksums, warm-up/repeats, p95 method, separate engine/layout/selection/cancel timings, and actual machine/browser/versions.
5. Investigate any failure before declaring completion. If a required target cannot be met, ask for an explicit plan/scope adjustment; do not change fixtures/targets silently.
6. Verify a fresh dependency install and local startup, CLI help/analyze/run, self-hosted assets, and GitHub Actions checks using real commits. Do not deploy or publish packages.
7. Complete README, language/bytecode/architecture/testing/evaluation/third-party docs, assignment report, demo script, sample JSON/Markdown reports, and verified visual evidence.
8. Both teammates rehearse the real unsafe-to-binding sequence and explain compiler, finite-lattice solver, verifier, and bounded VM. Convert report only when faculty format is known.
9. Update state/decision/handoff with actual evidence and limitations. Verify canonical remote, no project LICENSE/private artifacts, and clean repository before any authorized publication.

## Required Validation

- [x] Every PRD AC-01–17 has explicit test/demo/evidence, not only a checked task box.
- [x] CI and clean-install production checks actually pass; recorded benchmark targets pass or have approved revisions.
- [x] Reports/screenshots and README reflect implemented behavior; no projected measurement is presented as executed.
- [x] No incomplete feature, mock release data, hidden persistence, real SQL/shell call, or unreviewed scope reduction remains.
- [x] Deadline is 8 October 2026; Markdown format is confirmed; exact submission time remains unconfirmed and is not invented.

## Exit Gate

Release only after all acceptance evidence is complete and required publication/submission actions are authorized.

## State Updates and Continuation

Update [status](../status_update.md), [decision log](../decision_log.md), and [handoff](../context_handoff.md) with completed behavior, checks actually run, remaining issues, and next steps. Stop and ask for any unresolved choice or deviation from the approved plan.

Previous: [Phase 3](phase_3_codegen_vm.md).

## Measured local evidence

See docs/testing.md for final commands and docs/evaluation.md for the independent labels and actual performance protocol/results. All targets passed unchanged. Phase 4 implementation164b94a is published and [remote CI](https://github.com/harshshah-24/FlowGuard/actions/runs/37669529758) passed. Both human rehearsals remain unrecorded.

## Phase 4 publication and remote validation — 8 October 2026

Harsh explicitly approved publication. Implementation/evidence commit `164b94a` was fast-forwarded from `3a7678c` and pushed to canonical main without rewriting history. [GitHub Actions run 37669529758](https://github.com/harshshah-24/FlowGuard/actions/runs/37669529758) completed successfully for `164b94acd7d77681af46c80306b76cd2750ce513`: clean installation, typechecks, unit/CLI tests, production builds, deterministic evaluation, production Chromium and isolated integration checks. This is actual remote evidence, separate from local measurements. Human rehearsal and faculty submission remain unrecorded. A documentation-only follow-up publishes this verified record.
