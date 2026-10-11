# FlowGuard

**A visual compiler and static analyzer that explains unsafe input flow.**

FlowGuard is the Innovative Assignment for **4CS501CC25 Principles of Compiler Design**. It compiles a small typed language, tracks possible explicit input flow into modeled SQL/query or shell-command text, and executes verified bytecode in a bounded virtual machine. SQL and shell effects are simulated.

## What the project does

- **Analyze:** tokenize, parse, check names/scopes/types, build a typed control-flow graph, solve input-flow analysis, explain findings, generate bytecode, and verify it.
- **Inspect:** connect source locations to tokens, AST, symbols, graph nodes, final/replayed analysis states, findings, and bytecode instructions.
- **Run:** execute the current verified bytecode with supplied inputs; show runtime events, failures, and initialized top-level values.
- **Export:** download exact source and JSON/Markdown analysis reports, optionally including execution results.

The browser and CLI use the same TypeScript core. Findings describe possible explicit flows, not proven attacks or universal safety. Final values exclude block locals and temporary slots. Drafts stay in memory and disappear on reload; there are no accounts, database, autosave, backend analysis service, or remote runtime API.

## Project guides

- [Demo guide](demo_guide.md): setup, suggested faculty presentation, three end-to-end demonstrations, expected outputs, and viva questions.
- [Architecture guide](architecture_guide.md): exact implementation, file responsibilities, data contracts, algorithms, browser workers, CLI, and runtime.
- [PCD guide](pcd_guide.md): beginner-friendly compiler concepts mapped to the files that implement them.
- [Assignment report](FlowGuard_Innovative_Assignment.docx): the project report document for submission.

This branch is prepared for a source-code submission ZIP. Development plans and handoffs, GitHub automation, the report template, and evaluation/benchmark/capture utilities are omitted; the three root guides explain the submitted implementation. Functional tests and their fixtures remain available.

## Local setup

Use **Node.js 26.5.0** and **npm 11.17.0**, matching `.nvmrc` and the package manifest. From the repository root:

```sh
npm ci
npm run dev
```

Open [the development workspace](http://127.0.0.1:5173/).

For a production preview:

```sh
npm run build
npm run preview
```

Open [the production preview](http://127.0.0.1:4173/). Keep the serving terminal running. Dependency and browser installation require network access; prepare them before presenting.

## Validation

Install the test browser, then run the complete functional check:

```sh
npx playwright install chromium
npm run check
```

`check` runs typechecks, unit/CLI tests, builds, production browser tests, and the isolated static-integration browser tests. Stop a manually running production preview before browser tests, which start their own servers.

You can also run these individually:

```sh
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run test:phase2
```

The submission branch omits the development evaluation, benchmark, and automated demo-capture tools. These are not needed to compile, analyze, inspect, run, or export programs. Browser tests write disposable output under `test-results/`. Technical validation does not establish human rehearsal or faculty submission.

## CLI

After `npm run build`, use:

```sh
node packages/cli/dist/main.js --version
node packages/cli/dist/main.js --help
node packages/cli/dist/main.js examples/unsafe-query.fg --trace
node packages/cli/dist/main.js examples/bound-query.fg --format markdown --output report.md
node packages/cli/dist/main.js examples/arithmetic-loop.fg --run
node packages/cli/dist/main.js examples/bound-query.fg --run --inputs inputs.json
```

For the last command, create `inputs.json` containing `["Ada"]`. Reports do not overwrite existing output files unless `--overwrite` is explicitly supplied.

Exit codes: **0** completed without findings; **1** completed with findings; **2** invalid source/request/input file; **3** runtime/limit/internal/output failure; **130** cancellation. Runtime failure takes precedence over findings and retains completed static analysis in the report.

## Structure

| Location | Responsibility |
|---|---|
| `packages/core/` | Compiler, CFG, taint/provenance/replay, bytecode/verifier/VM, reports, contracts, and budgets. |
| `packages/cli/` | Flags, bounded file I/O, analysis/execution reports, and shared-memory cancellation. |
| `apps/web/` | Monaco editor, analysis/execution/layout workers, graph, inspectors, replay, inputs, and runtime panels. |
| `examples/`, `fixtures/` | Teaching programs and expected compiler, taint-analysis, and runtime behavior used by tests. |
| Root guides | Presentation walkthroughs, implementation reference, and PCD explanations. |
| `test-results/` | Generated local test output; ignored by Git and unnecessary in the submission ZIP. |

## Preparing the submission ZIP

Include application/core/CLI source, package manifests and lockfile, build configuration, `.nvmrc`, examples, the root guides, and the completed assignment report. Tests and their fixtures can remain to demonstrate correctness and preserve the documented validation commands.

Exclude `.git/`, `node_modules/` at every level, `.vite/`, `test-results/`, `playwright-report/`, `coverage/`, and generated `dist/` directories from a source ZIP. The recipient regenerates dependencies with `npm ci` and builds with `npm run build`. Development plans, GitHub workflows, the report template, and unused evaluation-only fixtures have already been removed from this branch.

## Historical documentation

The former documentation, development plans and handoffs, GitHub workflow, report template, evaluation/benchmark utilities and fixtures, and screenshots are preserved in the original repository at pre-cleanup commit **`debf7f4fc6b6e19621329d943b406f35c7f25342`**. They are not part of this submission layout. The source ZIP does not need Git; use the three root guides for the current implementation and presentation.

All project work belongs in [harshshah-24/FlowGuard](https://github.com/harshshah-24/FlowGuard). The repository has no project license. Historical third-party notes do not grant a license to FlowGuard itself.
