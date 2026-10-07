# Phase 4 Coding-Agent Handoff

**Updated:** 7 October 2026. The user requested publishing Phases 2/3 so their teammate can continue Phase 4 with a coding agent. Phase 4 continuation is authorized for that teammate; it has not been executed in this publication task.

## Starting point

Use the sole canonical repository [harshshah-24/FlowGuard](https://github.com/harshshah-24/FlowGuard), branch `main`. Phases 0–3 are functionally complete. The shared TypeScript core, browser workers and CLI perform real analysis, verified bytecode execution and simulated effects. Required `topLevelSymbolIds` metadata was explicitly approved and is implemented. No mock completion or missing final-value feature remains.

Read in order:

1. [Context handoff](context_handoff.md) and [status](status_update.md).
2. [PRD v0.3](flowguard_prd.md) and [master plan v1.3](implementation_plan.md), especially sections 14–18.
3. [Phase 4 tasks and exit gate](phases/phase_4_release_validation.md).
4. [Architecture](../docs/architecture.md), [language](../docs/language.md) and [executed testing evidence](../docs/testing.md).

## Establish your own baseline

Update a clean checkout without overwriting local work:

```sh
git switch main
git pull --ff-only origin main
```

Provide Node **26.5.0** and npm **11.17.0** using the project's `.nvmrc` and `packageManager`; the previous Windows TEMP toolchain is machine-specific. Then:

```sh
npm ci
npx playwright install chromium
npm run check
npm run dev
```

On Linux, Playwright may require `npx playwright install --with-deps chromium`. The workspace serves at loopback 5173. Production tests use 4173; the separate static harness uses 4174 and is absent from the release build.

Prior local full check: **260 unit/CLI tests, eleven production Chromium tests, four isolated static-integration tests**, typechecks and builds, on Windows. Verify current GitHub Actions and rerun on the teammate's actual machine; prior timings are not performance benchmarks.

## Work still required in Phase 4

- Map every PRD AC-01–17 to explicit test/demo/evidence and close the remaining browser/accessibility/race/offline/limit coverage required by the plan.
- Create the planned `scripts/evaluate.ts`, `scripts/benchmark.ts` and `tsconfig.scripts.json`; they do not exist yet. Use independently labeled fixtures/counting units, report precision/recall/confusion counts where applicable, and count invalid/incomplete outcomes separately.
- Benchmark the exact approved workloads, seeds/checksums, warm-up/repeats and p95 method. Record actual hardware/OS/Node/npm/browser versions; separate engine, layout, selection and cancellation timings. Investigate the existing large-main-chunk warning without silently altering targets, dependencies or language scope.
- Verify fresh installation, local startup, CLI help/analyze/run and self-hosted worker/editor assets. SQL/shell effects must remain simulated and drafts memory-only.
- Finish evaluation/bytecode/release documentation, real sample reports, verified screenshots, assignment report and demo script. Rehearse unsafe query → source-linked finding → binding correction → reanalysis → explicit simulated Run.
- Update status/handoff/decision/testing records with measured evidence. Do not label planned work as executed. If a required target cannot be met, seek an explicit adjustment rather than changing fixtures or limits.

Submission deadline is 8 October 2026; exact time, faculty template, teammate identities and demo hardware remain unspecified. Do not invent them or convert the report to an assumed faculty format. Preserve canonical history and the no-project-license decision. Publication of subsequent Phase 4 changes needs the applicable authorization; this handoff does not authorize deployment or package publication.

## Suggested initial prompt

> Continue Phase 4 of FlowGuard from the latest canonical main. Read context/phase_4_agent_handoff.md, context/context_handoff.md, context/implementation_plan.md and context/phases/phase_4_release_validation.md first. Phases 0–3 are complete and Phase 4 continuation is authorized. Verify the current checkout and CI, establish a fresh local test baseline, then carry out Phase 4 validation, independent evaluation, actual-machine benchmarks, documentation and demo/submission preparation. Preserve the approved scope, dependency pins and fixed budgets, and record only evidence actually measured. Ask about unresolved contract/target changes or missing faculty requirements; do not push or deploy further work without the applicable authorization.
