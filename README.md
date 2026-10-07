# FlowGuard

**A visual compiler and static analyzer that explains unsafe input flow.**

FlowGuard is the Innovative Assignment for **4CS501CC25 Principles of Compiler Design**. It connects compiler fundamentals with possible injection-related flows and an explicitly simulated bytecode runtime.

## Current Status

**Phases 2 and 3 are complete and validated locally.** The user authorized publication to canonical main; this change publishes the completed Phases 2/3 implementation. The previous main was `f4c0aa9` (Phase 1 publication record).

Analyze now completes the full compiler, taint, codegen and verifier pipeline. Explicit Run executes verified bytecode in a bounded VM with supplied JSON string-array inputs. The browser includes source-linked findings, graph/inspectors, replay, bytecode selection, runtime events, Stop/retry and matching-snapshot exports. CLI analysis/runtime uses the same core. SQL and shell effects are simulations.

The approved `topLevelSymbolIds` bytecode field supports final initialized values in symbol order, excluding block locals, temporaries and declarations not reached. Values remain available on core-reported runtime failures/limits/cancellation. Phase 4 continuation is authorized for the teammate and remains unstarted. Use the [Phase 4 agent handoff](context/phase_4_agent_handoff.md).

## Local Setup

Use **Node.js 26.5.0** and **npm 11.17.0**. From the repository root:

```sh
npm ci
npm run dev
```

Open [the local workspace](http://127.0.0.1:5173). Drafts live only in memory and disappear on reload. No account, database, backend analysis service, autosave, or remote runtime API is used.

## Validation

```sh
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Or run `npm run check` after the browser installation. Current local checks passed **260 unit/CLI tests, eleven production Chromium tests, four isolated static-integration Chromium tests, typechecks and builds** with Node 26.5.0/npm 11.17.0. `npm run test:phase2` runs the existing isolated harness. [Testing notes](docs/testing.md) record the full-check evidence and approved scope-metadata amendment. Remote CI for this publication must be checked separately from the recorded local validation.

CLI after building:

```sh
node packages/cli/dist/main.js --version
node packages/cli/dist/main.js --help
node packages/cli/dist/main.js examples/unsafe-query.fg --trace
node packages/cli/dist/main.js examples/bound-query.fg --format markdown --output report.md
node packages/cli/dist/main.js examples/arithmetic-loop.fg --run
node packages/cli/dist/main.js examples/bound-query.fg --run --inputs inputs.json
```

For example, `inputs.json` can contain `["Ada"]`. Exit codes: 0 completed without findings, 1 completed with findings, 2 invalid source/request/input file, 3 runtime/limit/internal/output failure, 130 cancellation. Runtime failure takes precedence over findings; failed runtime reports retain completed static analysis.

## Structure

- `packages/core/`: portable compiler, CFG, taint/provenance/replay, bytecode/verifier/VM, coordinator, reports, contracts and budgets.
- `packages/cli/`: strict flags, bounded files, analysis/run reports, no-clobber outputs and responsive shared-memory SIGINT handling.
- `apps/web/`: Monaco workspace, separate analysis/execution/layout workers, graph/inspectors/replay/bytecode/runtime panels, examples/help and state machine.
- `examples/`, `fixtures/`: synthetic, independently specified teaching examples and expectations.
- `context/`: PRD, master plan, phases, decisions, handoff, and status.
- `docs/`: language reference, validation, and third-party notes.

## Behavior

A custom typed language compiles into a source-linked control-flow graph and verified bytecode. Forward taint analysis explains possible explicit input flow into modeled query/command arguments. Run executes custom bytecode under fixed resource limits.

The TypeScript engine is shared by the CLI and browser workers. Inspection includes tokens, AST, symbols, states, findings, analysis replay, bytecode and runtime events. Conservative findings are not proven attacks or universal safety guarantees.

## Project Documents

- [Language reference](docs/language.md): grammar, types, errors, limits, and Phase 1 APIs.
- [Architecture](docs/architecture.md): compiler/runtime algorithms, transport, reports and remaining boundary.
- [PRD](context/flowguard_prd.md): product behavior and chosen scope.
- [Master implementation plan](context/implementation_plan.md): exact files, contracts, algorithms, dependencies, and checks.
- [Phase index](context/phases/README.md): ordered tasks and gates; Phases 0/1 are published; Phases 2/3 are complete locally.
- [Status](context/status_update.md), [handoff](context/context_handoff.md), and [decision log](context/decision_log.md).
- [Original ideas](context/project_ideas.md): exploration history, not current scope.
- [Third-party notes](docs/third_party.md): dependency licenses; no project license is added.

Target submission: **8 October 2026**, team of two. All project work belongs in [harshshah-24/FlowGuard](https://github.com/harshshah-24/FlowGuard). Implement later phases only with authorization and the latest approved plan.
