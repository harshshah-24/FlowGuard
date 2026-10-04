# FlowGuard

**A visual compiler and static analyzer that explains unsafe input flow.**

FlowGuard is the Innovative Assignment for **4CS501CC25 Principles of Compiler Design**. It connects compiler fundamentals with possible injection-related flows and an explicitly simulated bytecode runtime.

## Current Status

**Phase 0 foundation is implemented.** The repository now has pinned npm workspaces, strict shared models/contracts, source-location and resource-budget utilities, a React workspace shell, synthetic examples, tests, and GitHub Actions configuration.

The lexer, parser, type checker, graph builder, taint solver, code generator, verifier, and VM are not implemented yet. Analyze and Run are disabled in the UI. The CLI supports only a foundation version check and an honest unavailable message. No successful analysis is fabricated.

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

Or run `npm run check` after the browser installation. Phase 0 verification passed 28 unit tests, two production Chromium tests, typechecks, and builds. [Testing notes](docs/testing.md) distinguish these checks from later compiler/runtime acceptance and record the dependency audit findings. Remote GitHub Actions has not run yet.

Foundation CLI version check after building:

```sh
node packages/cli/dist/main.js --version
```

## Structure

- `packages/core/`: portable ESM models, schemas, source utilities, diagnostics, and budgets.
- `packages/cli/`: buildable CLI scaffold; analysis/execution adapters arrive later.
- `apps/web/`: editable foundation shell and pure workspace state machine.
- `examples/`, `fixtures/`: synthetic, independently specified teaching examples and expectations.
- `context/`: PRD, master plan, phases, decisions, handoff, and status.
- `docs/`: current validation and third-party notes.

## Planned Product

A custom typed language will compile into a source-linked control-flow graph and verified bytecode. Forward taint analysis will explain possible explicit input flow into modeled query/command arguments. An explicit Run action will execute only custom bytecode under resource limits; SQL and shell operations will remain simulated.

The TypeScript engine will be shared by Node CLI and browser workers. Planned inspection views include tokens, AST, symbols, states, findings, analysis replay, bytecode, and runtime events. Conservative flow findings will not be presented as proven attacks or universal safety guarantees.

## Project Documents

- [PRD](context/flowguard_prd.md): product behavior and chosen scope.
- [Master implementation plan](context/implementation_plan.md): exact files, contracts, algorithms, dependencies, and checks.
- [Phase index](context/phases/README.md): ordered tasks and gates; Phase 0 is published on main.
- [Status](context/status_update.md), [handoff](context/context_handoff.md), and [decision log](context/decision_log.md).
- [Original ideas](context/project_ideas.md): exploration history, not current scope.
- [Third-party notes](docs/third_party.md): dependency licenses; no project license is added.

Target submission: **8 October 2026**, team of two. All project work belongs in [harshshah-24/FlowGuard](https://github.com/harshshah-24/FlowGuard). Implement later phases only with authorization and the latest approved plan.
