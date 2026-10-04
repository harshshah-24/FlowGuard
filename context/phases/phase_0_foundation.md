# Phase 0 — Contracts and Foundation

**Suggested window:** 5 October 2026

**State:** Published on `main` at implementation commit `565b47c` (5 October 2026). User explicitly approved Phase 0 implementation. No later phase is implemented.

## Source of Truth

[Master implementation plan](../implementation_plan.md) defines exact interfaces, files, versions, algorithms, and limits. [PRD](../flowguard_prd.md) defines product behavior. This file is an actionable phase view of that plan; it does not replace or override either document.

Master sections 2–4, 10, and 13 define versions, files, contracts, limits, and tooling.

## Entry Gate

None beyond approval of the master plan.

## Ownership and File Scope

- **Teammate A:** Root/workspace manifests and TS configurations; core model/contracts/limits/source/diagnostics; contract/source tests.
- **Teammate B:** Web entry/layout skeleton, workspace reducer/types/selectors, example catalog skeleton, test/CI configuration.

Full file paths and additional tests/docs are in master section 3. Shared contracts must not change without synchronizing the master plan and affected phases.

## Ordered Tasks

1. Create root package.json, .nvmrc, tsconfig.base.json, workspace manifests/configurations, Vitest/Playwright configuration, and approved CI scaffold with the exact master-plan pins. Generate/commit the root npm lockfile during implementation; do not add LICENSE.
2. Define strict versioned models/schemas for both analysis and execution, spans/IDs/scalars, compiler artifacts, bytecode, results, limits, and diagnostics. Do not defer execution-model fields until Phase 3.
3. Implement original-source line indexing, UTF-16 spans, UTF-8 byte checks, BOM-preserving decoding rules, and budget counters/typed failures. Use immutable release limits and private lower-limit test hooks only.
4. Create synthetic catalog/fixture manifests with independently described expected behavior. Complete the relevant exact fixture contents as their algorithms are added.
5. Create a browser shell and pure reducer with empty/draft/partial/error states. Establish request/snapshot identity before worker integration; do not implement a fake successful compiler.
6. Configure build/typecheck/test commands for created modules. Compiler-dependent tests and end-to-end CI gates become required as their phases land; absence of compiler code cannot be disguised by mocked release success.
7. Extend .gitignore only for approved dependency/build/test outputs; retain context, lockfile, examples, and evidence.

## Required Validation

- [x] Contract tests reject invalid versions/unknown fields and preserve analysis/runtime outcome distinctions.
- [x] Source tests cover LF/CRLF/CR, leading BOM, Unicode, zero-width EOF, and UTF-8 size boundaries.
- [x] Limits tests assert cap/cap+1 and deadline behavior with fake clocks.
- [x] Typecheck/build configuration works for the modules actually created; schema fixtures for an empty program are validated without claiming empty-source compilation already exists.
- [x] Workspace source editing/revision/dirty-state tests pass; no database, backend, source persistence, or project license is introduced.

## Exit Gate

Contracts and build foundations are published on main. Typechecks, 28 unit tests, production build, and two Chromium checks passed; clean lockfile installation succeeded. See [validation evidence](../../docs/testing.md). No runnable analyzer or VM is claimed; remote CI passed for implementation commit `565b47c` (run `37237405149`).

## State Updates and Continuation

Update [status](../status_update.md), [decision log](../decision_log.md), and [handoff](../context_handoff.md) with completed behavior, checks actually run, remaining issues, and next steps. Stop and ask for any unresolved choice or deviation from the approved plan.

Next: [Phase 1](phase_1_frontend_lowering.md).
