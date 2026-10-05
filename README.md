# FlowGuard

**A visual compiler and static analyzer that explains unsafe input flow.**

FlowGuard is the Innovative Assignment for **4CS501CC25 Principles of Compiler Design**. It connects compiler fundamentals with possible injection-related flows and an explicitly simulated bytecode runtime.

## Current Status

**Phase 1 is implemented and published on `main` at `ed9f952`.** Core APIs now tokenize, parse, check scope/types, and lower source into a typed instruction graph with short-circuit branches and loop edges. The browser has a locally bundled Monaco editor, example/help panels, UTF-8 file loading, explicit source downloads, and dirty-draft replacement protection.

The taint solver, completed Analyze flow, graph presentation, bytecode generator/verifier, and VM arrive in later phases. Analyze and Run remain disabled. The CLI remains a version/unavailable scaffold. No security verdict or execution is fabricated.

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

Or run `npm run check` after the browser installation. Phase 1 verification passed 111 unit tests, six production Chromium tests, typechecks, and builds. [Testing notes](docs/testing.md) distinguish these checks from later compiler/runtime acceptance and record the dependency audit findings. Remote Phase 0 and Phase 1 CI passed.

Foundation CLI version check after building:

```sh
node packages/cli/dist/main.js --version
```

## Structure

- `packages/core/`: portable compiler front end, lowering/CFG validation, models, source utilities, diagnostics, and budgets.
- `packages/cli/`: buildable CLI scaffold; analysis/execution adapters arrive later.
- `apps/web/`: Monaco workspace, file/snapshot adapters, examples/help, and pure state machine.
- `examples/`, `fixtures/`: synthetic, independently specified teaching examples and expectations.
- `context/`: PRD, master plan, phases, decisions, handoff, and status.
- `docs/`: language reference, validation, and third-party notes.

## Planned Product

A custom typed language will compile into a source-linked control-flow graph and verified bytecode. Forward taint analysis will explain possible explicit input flow into modeled query/command arguments. An explicit Run action will execute only custom bytecode under resource limits; SQL and shell operations will remain simulated.

The TypeScript engine will be shared by Node CLI and browser workers. Planned inspection views include tokens, AST, symbols, states, findings, analysis replay, bytecode, and runtime events. Conservative flow findings will not be presented as proven attacks or universal safety guarantees.

## Project Documents

- [Language reference](docs/language.md): grammar, types, errors, limits, and Phase 1 APIs.
- [PRD](context/flowguard_prd.md): product behavior and chosen scope.
- [Master implementation plan](context/implementation_plan.md): exact files, contracts, algorithms, dependencies, and checks.
- [Phase index](context/phases/README.md): ordered tasks and gates; Phase 0 is published on main.
- [Status](context/status_update.md), [handoff](context/context_handoff.md), and [decision log](context/decision_log.md).
- [Original ideas](context/project_ideas.md): exploration history, not current scope.
- [Third-party notes](docs/third_party.md): dependency licenses; no project license is added.

Target submission: **8 October 2026**, team of two. All project work belongs in [harshshah-24/FlowGuard](https://github.com/harshshah-24/FlowGuard). Implement later phases only with authorization and the latest approved plan.
