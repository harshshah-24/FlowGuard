# FlowGuard — Product Requirements Document

**Course:** 4CS501CC25 Principles of Compiler Design

**Project:** FlowGuard — Visual Static Analyzer for Unsafe Input Flow

**Version:** 0.2

**Updated:** 2026-10-05

**Status:** Detailed draft for product review. Document editing and publication are authorized; proposed product requirements and architecture are not yet approved for implementation.

## 1. Purpose and Requirement Categories

FlowGuard connects compiler fundamentals to an educational security application. It analyzes a small language without executing it, tracks possible explicit flows of untrusted input, and explains findings through source-linked compiler artifacts and an interactive control-flow graph.

This PRD describes what to build, why it exists, how it should behave, and how the major pieces connect. It is the foundation for a later deterministic implementation plan, not permission to start implementation.

The following categories apply throughout this document:

- **Required behavior (R):** Proposed release requirements. Once the PRD is approved, these become acceptance obligations. They do not select a library or deployment architecture unless explicitly stated.
- **Recommended implementation (REC):** Suggested technical choices that may be adopted only after review. Recommendations are not approved decisions.
- **Assumption (A):** Planning information believed useful but not confirmed. Assumptions must not silently become requirements.
- **Open decision (OD):** An unresolved choice with its impact and resolution gate. Implementation of affected features must wait for resolution.

The project selection is confirmed. The custom-language scope, operation model, technology stack, deployment details, and performance budgets remain draft proposals. Existing exclusions below describe the proposed initial release, not new user commitments.

## 2. Problem, Users, and Value

Students usually encounter lexing, parsing, semantic analysis, and data-flow analysis separately. FlowGuard should make the full chain visible: source text becomes a syntax tree, a control-flow graph, analysis states, and source-linked findings.

Primary users are compiler-design students and course evaluators. Secondary users are developers learning how input-flow analysis works.

The memorable demonstration is an animated analysis explanation: select an unsafe-query example, follow input through assignments and branches, inspect the sensitive operation, edit the program to use modeled parameter binding, and analyze again.

The tool must show the algorithm's reasoning rather than use an unexplained risk score. The contribution is the compiler front end, graph construction, data-flow algorithm, and explanation system. No claim is made that taint analysis itself is new.

## 3. Scope and Constraints

### 3.1 Required initial behavior

- **R-01:** Accept source text in one explicitly specified educational language, subject to OD-01.
- **R-02:** Support typed scalar variables, expressions, assignments, conditions, loops, and the approved built-ins.
- **R-03:** Produce tokens, an abstract syntax tree, resolved symbol information, a control-flow graph, and taint-analysis results for valid programs.
- **R-04:** Provide an interactive desktop-browser workspace and command-line analysis using the same semantic rules and result contract, subject to OD-04.
- **R-05:** Explain possible explicit input flow to modeled query-text and shell-command arguments.
- **R-06:** Provide analysis replay, example programs, source-linked findings, and structured/readable report export.
- **R-07:** Work without remote analysis services, credentials, or external APIs after dependencies and application assets are installed.

### 3.2 Proposed exclusions

User-defined functions, recursion, objects, arrays, pointers, heap analysis, multiple files, implicit control-dependent information flow, full compatibility with Python/C/Java/JavaScript, symbolic execution, path-feasibility proofs, automatic repairs, arbitrary sanitizer inference, interval analysis, runtime execution, real database/shell integration, accounts, collaboration, and cloud analysis are outside the proposed first release.

A cloud-hosted showcase is not part of the current local-first proposal. Its security and persistence requirements would need separate review.

### 3.3 Confirmed constraints

- The submission must include a working prototype/tool, source code, and documentation.
- Compiler and core CS fundamentals must be the main contribution.
- Visual appeal and a distinctive use case are explicit project goals.
- All project work must be versioned in `harshshah-24/FlowGuard` only.
- No implementation code is authorized by this documentation task.

## 4. Architecture and Component Responsibilities

### 4.1 Required logical components

- **Workspace controller:** Owns source revision, active request, selected example, current result, selected finding/node, and replay position. Prevents stale messages from changing current results.
- **Input adapter:** Reads text or a user-selected file; checks encoding and source limits; creates a source snapshot. It must not accept arbitrary server filesystem paths from browser input.
- **Analysis coordinator:** Validates the request, invokes compiler stages in order, reports progress, enforces cancellation and limits, and returns exactly one terminal outcome.
- **Lexer:** Produces tokens and source spans; identifies invalid characters and unterminated literals/comments.
- **Parser:** Produces an AST with precedence and source spans; reports syntax diagnostics.
- **Semantic checker:** Resolves names/scopes, checks declarations/types/built-in signatures, and applies the approved initialization policy.
- **Graph builder:** Produces execution-order nodes and labeled edges from the resolved AST.
- **Data-flow engine:** Computes incoming/outgoing explicit-taint states using a terminating worklist analysis.
- **Finding/provenance builder:** Creates sink-argument findings from converged states and bounded explanations of contributing input sources.
- **Replay recorder:** Records analysis updates without changing the solver's result or allowing trace storage to grow without a limit.
- **Report serializer:** Converts a result into versioned structured data and readable text. It never silently drops incomplete-status information.
- **Graph presenter:** Lays out semantic graph data and maps selections back to source. Visual layout must not alter the graph analyzed by the engine.
- **CLI adapter:** Reads a file, invokes the same engine contract, writes reports, and maps terminal outcomes to documented exit codes.

The analysis engine must not depend on editor or graph-rendering state. UI and CLI must not implement separate taint semantics.

### 4.2 Recommended deployment architecture

**REC-01:** Use a TypeScript analysis package shared by a Node.js CLI and a React browser application. Run analysis in a Web Worker so compiler work does not block the editor. Use a local static asset server for the browser interface.

Under this recommendation, there is no application backend, HTTP analysis API, database, login service, or remote analysis job queue. The logical service modules above run inside the worker or CLI process. The local server serves application assets only.

**OD-04:** Confirm browser-worker/shared-TypeScript architecture versus a separate local backend. A backend choice changes transport, authentication boundaries, job lifecycle, packaging, and cancellation. Resolve this before interfaces and files are frozen in the implementation plan.

Do not add a backend merely because this PRD includes API/service requirements. Those requirements describe boundaries and behavior independent of transport.

## 5. Data Flow and Control Flow

### 5.1 Data movement

1. The editor or CLI input adapter creates a snapshot containing the exact source and its revision/identity.
2. The controller creates a request with unique request ID, snapshot, schema version, and bounded options.
3. The coordinator validates the envelope and sends a running/progress state.
4. Source moves through tokens, AST, semantic model, and control-flow graph. Each artifact retains spans referring to the original source snapshot.
5. The solver produces taint states and recorded updates. The finding builder uses final states and provenance information.
6. The coordinator returns a terminal result with artifacts, diagnostics, completion flags, statistics, and limitations.
7. The controller accepts the result only if request ID and source revision still match its active snapshot.
8. Presentation components derive graph highlighting, source marks, and inspector content from that accepted result.
9. Export serializes that result snapshot, not whichever text happens to be in the editor later.

### 5.2 Processing control

Request validation precedes lexing. Lexing precedes parsing; parsing precedes semantic checking; semantic checking precedes graph building; graph building precedes taint analysis; converged analysis precedes final findings.

A blocking error stops dependent stages. Previously completed artifacts may remain inspectable with an explicit partial-artifact label. Findings from an invalid or incomplete analysis are not shown as completed findings.

Cancellation and source editing are separate events. Editing marks a previous result stale. Starting a new run invalidates the previous request; late results must be ignored even if a cancellation acknowledgement is delayed.

## 6. Language and Built-In Semantics

### 6.1 Proposed behavior

The language has string, integer, and boolean types; declarations, assignments, arithmetic/comparison/boolean expressions; blocks; `if/else`; `while`; and comments. Expressions have documented precedence and associativity. No implicit conversion between scalar types is proposed. String `+` means concatenation; integer `+` means arithmetic addition.

All unknown operations, unsupported constructs, wrong argument counts, wrong types, and unresolved identifiers generate semantic or syntax diagnostics rather than receiving guessed behavior.

### 6.2 Modeled operations

- **`input(prompt)`:** One string argument; returns an untrusted string. Each source occurrence has a stable source ID within a snapshot, including occurrences in loops.
- **`print(value)`:** One scalar argument; does not create an injection finding. No program is actually executed.
- **`sql_query(query)`:** One string argument; taint in that argument produces a query-text finding.
- **`sql_bind(template, value)`:** String template and one scalar bound value. Taint in the template produces a query-text finding. Taint in the bound value alone does not. Binding does not remove taint from the value.
- **`shell(command)`:** One string argument; taint in that argument produces a command-text finding. No operating-system command is invoked.

The analyzer does not parse SQL or shell syntax or verify exploits. These names describe educational source/sink models, not integrations with production drivers.

### 6.3 Product-impacting language decisions

- **OD-02:** Freeze declaration syntax, scoping/shadowing, integer arithmetic, comparison rules, comments, escapes, built-in expression/statement positions, and initialization requirements before front-end implementation.
- **REC-02:** Require declaration initializers and reject duplicate declarations in a scope. Define branch/loop scope explicitly so no variable can acquire an undefined value through an unhandled path.
- **OD-03:** Resolve the earlier “exactly one placeholder” proposal for `sql_bind`. Static taint analysis cannot generally count placeholders in an arbitrary dynamic string. Recommended behavior: validate the documented `?` placeholder rule only for directly known string literals; mark other templates as placeholder-unverified, while still analyzing their taint. An unverified placeholder is not automatically a completed format validation or an injection finding.

Do not silently implement full SQL placeholder parsing, infer runtime string contents, or discard tainted-template findings to enforce a literal-only rule. The approved decision must specify diagnostic severity and whether placeholder uncertainty blocks analysis.

## 7. Compiler and Analysis Internals

### 7.1 Front end

**R-08:** The lexer, parser, and semantic checker preserve source spans and produce actionable diagnostics. The AST distinguishes declarations, assignments, branch/loop conditions, built-in calls, literals, and operator expressions. Symbols identify declarations independently of spelling so scope and shadowing cannot corrupt analysis.

**REC-03:** Write a lexer and recursive-descent parser with precedence-based expression parsing. This exposes fundamentals directly. Parser-generator acceptance remains OD-05; do not treat a recommendation as course approval.

Malformed input must not cause endless recovery, stack overflow, or an unhandled exception. Recommended initial recovery is to stop at the first blocking lexical/parser error with completed-stage artifacts only. Multiple-error recovery is optional until its limits and semantics are planned.

### 7.2 Graph construction

**R-09:** Include entry/exit nodes, sequential edges, true/false edges, joins, loop tests, loop-body paths, and back edges. Link statements and expression-source spans to graph elements. Account for the zero-iteration loop path.

**REC-04:** Use statement-level nodes to simplify explanation. Lower declarations/assignments and calls in source order. Conditional edges represent structural alternatives rather than proven feasible branches. Do not implement constant-condition pruning in the initial analysis unless separately approved.

**OD-02:** Short-circuit operators affect expression control flow. Either define eager boolean evaluation for the custom language or represent short-circuit evaluation correctly in the graph. Freeze this rule before graph construction.

### 7.3 Taint domain and solver

**R-10:** Track explicit source contributions, merge conservatively, terminate on supported inputs, and retain both possible branch contributions. A trusted overwrite removes earlier sources for that variable along that path. Analysis of loops must include repeated propagation.

**REC-05:** Represent a state as a mapping from symbol IDs to sets of syntactic input-source IDs. The empty set means no explicit untrusted source is tracked, not a universal safety guarantee. Use a separate unreachable/unvisited marker; it must not be confused with a reached node whose variables have empty source sets.

Recommended expression rules:

- A literal has an empty source set.
- A variable read uses its current symbol's source set.
- An `input` expression contributes its own source ID. Its prompt does not become the identity of the returned source.
- Supported value-combining operators union their operands' source sets.
- A declaration or assignment replaces the target's set with the right-hand expression's set.
- A join unions each symbol's sets from reached predecessors. Conditions do not automatically taint all assignments in their branches.
- Scope exit removes inaccessible symbols; scope entry and declaration rules follow the approved language semantics.

Recommended solver behavior:

1. Initialize entry with the valid initial environment; other nodes start unvisited.
2. Schedule entry and process nodes in deterministic order.
3. Merge available predecessor outputs to compute input state.
4. Apply the statement's transfer rule to compute output state.
5. If output changes or a node becomes reachable, schedule its successors without duplicate queue entries.
6. Stop when the worklist is empty, or return cancelled/incomplete on a documented limit.

Source IDs are bounded by the source file and the domain is finite. Transfer rules must be monotone under set inclusion. Repeated input in a loop must not allocate a new source ID per iteration. These properties support termination; implementation still needs a formal description and convergence tests.

### 7.4 Findings and explanation

**R-11:** Evaluate sensitive arguments using converged states. Group contributing sources into one finding per sensitive call argument and rule, rather than emitting one warning per solver visit. Stable ordering follows source location and rule ID.

**REC-06:** Record bounded dependency facts linking definitions/expressions to contributing sources. Reconstruct explanations with visited-node detection and deduplication so loop provenance cannot recurse indefinitely. Explain branch merges and cycles with labels instead of inventing a single executable path.

If provenance is limited or cannot show all contributions, retain the finding and source set, mark the explanation incomplete, and provide the available facts. Incomplete explanation and incomplete analysis are different conditions.

### 7.5 Replay

**R-12:** Replay represents analysis updates, not runtime execution. Each event records node, update index, changed symbols, and corresponding before/after states or reconstructable deltas. Final replay state must agree with final solver state when the trace is complete.

**REC-07:** Record deltas and bounded checkpoints. On the trace limit, stop recording additional events, mark replay truncated, and continue solving within the independent analysis limit. Do not declare analysis incomplete solely because replay is truncated.

## 8. Data Models and Schema Requirements

**R-13:** Publish a versioned structured result schema before adapters and export are implemented. The following entities and invariants are required; exact field names and encoding are plan-level decisions.

- **SourceSnapshot:** Snapshot ID, revision, display filename, exact source text, and identity checksum. Revision prevents stale UI results; checksum identifies exported inputs. Neither is an authentication mechanism.
- **SourceSpan:** Start/end offsets and derived line/column positions. Specify zero/one-based conventions, exclusive/inclusive end, Unicode handling, and newline rules in OD-06. All adapters use the same convention.
- **AnalysisRequest:** Protocol/schema version, request ID, source snapshot, supported bounded options, and effective limit profile.
- **Token:** Kind, source span, and display lexeme or literal representation. End-of-file handling is specified.
- **ASTNode:** Stable node ID, node kind, source span, relevant operands/children, and resolved symbol references after semantic checking.
- **Symbol:** Symbol ID, name, declared type, declaration span, scope ID, and initialization information according to the approved policy.
- **CFGNode/CFGEdge:** IDs, node kind, associated AST/source references, edge endpoints, and edge kind. Every edge endpoint and source reference must exist.
- **InputSource:** Source ID, input-call span, and user-readable label. Labels render as text.
- **TaintState:** Reachability plus symbol-to-source-set mapping. Sets are serialized in stable order and distinguish absent/out-of-scope symbols from empty taint.
- **Diagnostic:** Stable code, stage, severity, message, source span when available, and blocking status. Internal failures omit source spans when no valid mapping exists.
- **Finding:** Rule ID, finding ID, sensitive operation, argument index, sink span, contributing source IDs, explanation references, and explanation completeness. Findings describe possible flows, not confirmed exploits.
- **ReplayEvent:** Ordered update index, affected node/symbols, state changes, and checkpoint reference where needed.
- **AnalysisResult:** Request/snapshot identity, schema/analyzer/language versions, terminal status, completed stages, artifacts, diagnostics, final findings where valid, replay completeness, statistics, effective limits, and limitations.
- **ExampleProgram:** Stable example ID, title, purpose, source, expected behavior, and limitation notes. Expected behavior is a teaching fixture, not a substitute for test assertions.

Run IDs and timestamps can differ between runs. Semantic artifacts, findings, and their ordering must be deterministic for the same source, semantics, and effective limits.

### 8.1 Database and persistence

**R-14:** Ordinary analysis does not persist or upload source without an explicit save/export action. No application database or relational schema is required for the proposed stateless local release.

**REC-08:** Keep source, results, and examples in memory; package examples as static versioned assets. Save/export uses user-selected downloads or CLI output files. Do not add localStorage/IndexedDB autosave silently.

**OD-07:** Decide whether draft recovery or analysis history is wanted. If added, specify storage schema/version, source retention, deletion, recovery behavior, quota failure, and privacy implications before implementation. Account/project tables are not justified by current scope.

## 9. APIs, Interfaces, and Integrations

### 9.1 Required logical analysis API

**R-15:** Provide analyze, cancel, progress, and terminal-result behavior with a shared request/result contract. A caller must not pass arbitrary code to execute, filesystem paths for the engine to open, or names of external commands/services.

Analyze receives a snapshot and supported options. Validate the envelope before processing. Reject unsupported schema versions, invalid field types, invalid limits, or excessive source sizes with a structured invalid-request diagnostic. No dependent stage may run after rejection.

Progress includes request identity, current stage, and bounded stage statistics. Show stage text without claiming a fabricated overall completion percentage. Terminal outcomes are completed, invalid-source, invalid-request, cancelled, incomplete-limit, or internal-error.

Completed means every required analysis stage converged. It can contain findings or no findings. Invalid-source means source-language errors prevent analysis. Incomplete-limit and cancelled never mean “no unsafe flow.” Internal-error means a product defect or execution environment failure, not a source diagnostic.

Exactly one terminal outcome is accepted per active request. Duplicate or late messages are ignored. A new request can replace an old one; it must not mix artifacts across runs.

### 9.2 Recommended worker transport

**REC-09:** Exchange versioned messages containing message type and request ID: analyze request, progress, result, and cancel intent. Validate incoming messages on both sides. Worker outputs contain plain serializable data, not UI components or executable callbacks.

For a CPU-bound worker, cooperative message cancellation alone may not be serviced promptly. Recommended cancellation is worker termination/recreation, with the controller synthesizing a cancelled state and rejecting late messages. Future requests start in a fresh worker. A worker error becomes internal-error; retain the source and allow retry.

### 9.3 Backend alternative — decision-gated

If OD-04 selects a backend, the implementation plan must define endpoint paths, request/response schemas, HTTP status mapping, job identity, polling/streaming, cancellation, expiry, body limits, loopback binding, origin checks, and CLI reuse before implementation.

The required behavior still applies: malformed request is distinct from invalid source; a valid submitted program with a compiler error is an analysis outcome, not an unhandled HTTP failure. No HTTP endpoint is currently an approved product requirement.

### 9.4 CLI behavior

**R-16:** Read a user-specified local file, reject undecodable or oversized input, invoke the shared engine, and produce documented terminal outcomes. Structured output goes to stdout or an explicitly chosen file; progress and human errors go to stderr so JSON output is not corrupted.

**REC-10:** Exit 0 for a completed run without findings, 1 for completed findings, 2 for invalid request/source, and 3 for incomplete/internal failure; use a documented interrupt status for user cancellation. Freeze exit codes and flags before scripting interfaces are implemented.

Never overwrite an existing report without an explicit documented overwrite option or confirmation. Output failure is an I/O failure, not a change to analysis correctness.

### 9.5 External interactions

No database, shell, AI, identity provider, or remote analyzer is invoked. Runtime network activity should be limited to loading locally served application assets under the local proposal. Package installation is separate from runtime analysis. Graph/editor libraries are dependencies, not external analysis services.

## 10. Screens, Components, Navigation, and User Flows

### 10.1 Required screens

- **Workspace:** Source editor, Analyze/Cancel controls, current run/status, graph, findings, inspector tabs, and export/save actions. This is the primary screen.
- **Examples view:** Titles, purpose, expected behavior, and a load action. Loading replaces source only after a dirty-source warning is resolved.
- **Language/help view:** Supported syntax, modeled built-ins, diagnostics, analysis limitations, and keyboard controls. It must not imply unsupported general-language compatibility.

**REC-11:** Keep Examples and Help as panels within a single-page workspace rather than introducing accounts or a dashboard. Navigation must preserve the current draft in memory. On a full reload, follow the approved persistence behavior, not an implied recovery promise.

### 10.2 Component behavior

- **Editor:** Line numbers, diagnostic markers, selection highlights, source revision tracking, and editable source during analysis.
- **Graph:** Pan/zoom/fit, node selection, labeled branch/back edges, and text/icon distinctions for input sources and sinks.
- **Findings list:** Stable ordering, operation/argument labels, possible-flow wording, and selection that synchronizes source and graph.
- **Inspector:** Tokens, AST, symbols, node input/output states, and diagnostic details. Missing-stage artifacts have an explicit unavailable reason.
- **Replay controls:** Play, pause, next, previous/checkpoint navigation, reset, event index, and truncation notice. Control availability follows trace state.
- **Status area:** Current stage, completion/invalid/cancelled/stale state, and effective limits where useful.
- **Export dialog/action:** Select structured or readable output for a known result snapshot. Stale results require an explicit “export previous snapshot” label.
- **Unsaved-change prompt:** Save, discard, or cancel before examples/file loading replaces unsaved source.

### 10.3 Required flows

**New analysis:** Enter source → analyze → see progress → receive result → select finding/node → inspect source and state → optionally replay/export.

**Correction comparison:** Load unsafe example → analyze → inspect taint → edit to modeled binding → stale indicator → reanalyze → previous highlights cleared → updated result. A separate automated side-by-side diff is not required.

**Invalid source:** Analyze malformed text → source-linked error → completed artifacts only → fix text → run again. No old security finding appears as belonging to the invalid run.

**Cancellation:** Start analysis → cancel → show cancelled → retain source → retry. Cancellation must not masquerade as a completed result.

**File/save:** Load a supported text file with dirty-source protection → validate it → update source revision. Save downloads the current source; exported reports refer to the analyzed snapshot.

**CLI:** Provide local input → validate → analyze → serialize outcome → return documented exit status. No browser is required.

## 11. UI State Transitions and Fallbacks

**R-17:** Define and test the following distinct states:

- **Initial/empty:** Blank editor, guidance or example action, no graph/findings. Analyze is disabled for whitespace-only input under the recommended empty-input policy.
- **Running:** Stage indicator and Cancel action; prior results are clearly previous/stale or hidden. Prevent duplicate active runs.
- **Completed with findings:** Current graph, findings count, explanatory wording, and export available.
- **Completed without findings:** “No unsafe flows detected by the supported analysis.” Show graph/inspectors rather than a blank failure-like panel.
- **Invalid source:** Diagnostic list and relevant markers; unavailable downstream stages labeled. No completed taint verdict.
- **Invalid request/file:** Actionable encoding/size/options error, unchanged prior source if file loading failed.
- **Cancelled:** Source retained; no final security verdict for that run; retry available.
- **Incomplete-limit:** Identify the limit/stage and offer a smaller-input retry. Partial artifacts are explicitly labeled.
- **Internal failure:** Short diagnostic ID, source retained, retry/restart guidance; private internals are not leaked through generic UI messages.
- **Stale:** Source differs from analyzed snapshot; old marks are not positioned against new text. Reanalysis available.
- **Export success/failure:** Success after serialization/download initiation, not a claim that the user retained the file. Failure leaves analysis intact and offers retry.
- **Replay/provenance truncated:** Analysis completion remains separate; incomplete explanation/replay is visible.
- **Graph layout failure:** Findings and inspectors remain usable; show a graph-specific error and a recommended unpositioned/list fallback. Do not discard successful analysis.

Editing during a run invalidates that run for the current editor revision. Pause/reset replay on edit. Choosing a new example/file requires dirty-source handling; a rejected load must not replace the draft. Empty results, absent artifacts, failed rendering, and no findings are different states.

## 12. Validation, Errors, Authentication, and Permissions

### 12.1 Input validation

**R-18:** Validate request shape/version, source encoding/size, parser nesting, supported options, and output paths in their owning adapters. The engine validates source independently of UI controls. No imported structured report is executed; report import is outside initial scope.

Reject unsupported syntax/types with diagnostics. Do not attempt to repair or reinterpret another language silently. Detect bad source spans and broken internal references as engine errors before presenting misleading highlights.

### 12.2 Error behavior

Diagnostics identify stage, stable code, location when known, expected construct/type where applicable, and whether processing stopped. Limit failures identify the relevant budget. Cancellation is not an error toast. Internal failures have a distinct code and sanitized message; developer diagnostics must not log entire source by default.

Failures must preserve source and allow a new request. Report serialization, file output, graph layout, and replay failures do not retroactively invalidate converged analysis unless they reveal corrupt result data.

### 12.3 Authentication and authorization

**Required boundary:** The proposed local single-user tool has no account system or role-based permissions. The browser may analyze the currently supplied text and read files the user explicitly selects. The CLI may read its explicitly supplied file under operating-system permissions.

**REC-12:** No authentication service for a browser-worker implementation; no server-side protected records exist. Bind the local asset server to loopback, not a public network interface. Do not introduce cookies, tokens, or administrator roles without a product need.

A local-backend alternative needs explicit loopback/origin and request protections under OD-04. Remote hosting, server-side source storage, and multi-user access trigger a new authentication/authorization design decision; “no login” must not be extrapolated to those architectures.

### 12.4 Security requirements

- Never execute source, call `eval`, invoke modeled commands, or interpolate source into executable code.
- Render source, filenames, prompts, graph labels, and diagnostic text as text, not unsanitized HTML.
- Bound source/AST/graph/solver/replay/report resources; deeply nested input must fail cleanly.
- Do not upload, log, or persist source automatically. Examples contain synthetic data only.
- Keep secrets, environment files, and local artifacts outside version control; share configuration examples without secrets.
- If a backend is approved, enforce body limits and origin policy and disallow arbitrary filesystem access; no shell-based source processing.
- Dependency and release checks must cover known relevant vulnerabilities and unsafe rendering paths. Avoid adding remote telemetry without approval.

## 13. Configuration and Recommended Dependencies

**R-19:** Declare effective settings for source size, nesting, graph size, solver budget, time limit, trace/provenance limits, and rendering thresholds. Record limits in reports. Document defaults and reject invalid configuration; do not silently disable protection.

Source programs cannot change engine configuration. CLI flags and application settings use the same validated configuration model. Restrict changes to a bounded approved range. Protocol/schema/analyzer/language versions are explicit.

**Recommended stack, pending OD-04/OD-05:**

- TypeScript for the shared engine and typed contracts; Node.js for CLI execution.
- React with Vite for the local browser interface and asset packaging.
- Monaco Editor for source editing and markers.
- React Flow for graph interaction; a layout engine such as ELK after graph-size and worker packaging evaluation.
- Web Workers for browser analysis isolation and cancellation.
- Vitest for engine/contract tests and Playwright for meaningful browser flows.

Exact versions, package manager, licenses, compatibility, graph-layout package, and lockfile policy must be fixed in the approved implementation plan. Do not claim that these libraries are installed or selected. The recommendation avoids a database/backend for the stateless local scope; Python/local-server remains an alternative if course or team constraints require it.

## 14. Performance, Scalability, and Reliability

### 14.1 Required behavior

- Bounded requests cannot grow memory or work indefinitely.
- The UI remains responsive while analysis runs; cancellation or termination is available.
- New runs release old workers/traces/results according to explicit retention rules.
- Results are deterministic apart from request IDs, timings, and other declared metadata.
- Multiple browser tabs do not share or leak drafts by default.
- Large visual graphs may use a documented simplified/list view, but findings and node inspection remain available.

### 14.2 Recommended measurable targets — OD-08

On an agreed reference laptop/browser, benchmark at least 20 varied fixture programs:

- For a source of at most 1,000 nonblank lines, at most 500 CFG nodes, and at most 50 input sources: recommended p95 engine analysis time at most 2 seconds, measured separately from rendering.
- Recommended p95 graph layout/render readiness at most 2 seconds for 200 nodes, measured separately from analysis.
- Recommended visible selection response and cancellation acknowledgement at most 250 milliseconds under the reference workload.
- Recommended default limits: 256 KiB UTF-8 source, parser nesting depth 128, 2,000 CFG nodes, 200,000 solver node visits, 10-second analysis deadline, and 10,000 recorded replay events.

These are draft budgets, not achieved results or approved limits. Define provenance/report-size caps and the browser memory budget in OD-08 before implementation. Limit checks must apply within long-running stages; a timer checked only after computation is insufficient.

### 14.3 Scalability and reliability strategy

Initial scope is one bounded local analysis per workspace, not server-scale multi-tenancy. Recommended source sets use indexed IDs/bitsets when appropriate; deduplicate queue entries and provenance; cap replay; isolate rendering from solving. Complexity and memory bounds must be documented after the exact representation is chosen.

For larger programs, fail with a clear limit or reduce presentation detail without claiming unsupported scale. No distributed processing or database caching is required. Offline capability means local assets and dependencies are available; a hosted page requiring a network load is not an offline guarantee.

## 15. Deployment and Operations

**R-20:** Provide reproducible local install/start/CLI instructions, a documented supported runtime/browser, an example verification run, and a versioned release process. The package must load editor/worker/layout assets locally rather than require a CDN at analysis time.

**REC-13:** Ship a static browser build plus the shared engine/CLI. Document loopback startup and dependency installation. Include lockfiles and example settings after stack selection. Configure the bundler for worker/editor assets and test a production build, not only development mode.

Server deployment, public hosting, CI provider, packaging format, runtime versions, and license are OD-09. No deployment action is authorized by this PRD. Changes to source retention or remote processing require product/security review.

No database migration is needed under the no-database recommendation. Schema changes still require explicit export/protocol versioning; adapters reject incompatible versions rather than guessing. CLI compatibility and migration notes must accompany breaking releases.

## 16. Testing and Evaluation Requirements

### 16.1 Compiler and analysis tests

Test token positions/escapes/comments, precedence/associativity, scope/type/argument checks, graph structure and loop edges, direct/transitive/multiple-source taint, trusted overwrites, branch merges, zero-iteration loops, stable convergence, input occurrences in loops, binding template/value separation, and sink deduplication.

Expected states and findings must be derived independently from the algorithm implementation. Include metamorphic checks such as renaming a variable without changing findings and replacing untrusted input with a literal removing only dependent findings. Test termination and queue/provenance bounds.

### 16.2 Contract, UI, CLI, and security tests

Validate malformed/unsupported requests, stale/duplicate messages, edit-during-run races, cancellation/retry, invalid file encoding, partial artifact labels, layout failure fallback, trace truncation versus analysis completion, exports of exact snapshots, CLI parity, report I/O failure, text rendering of HTML-like source, oversized/deep input, and absence of modeled execution/network calls.

Test keyboard-accessible findings and controls, non-color-only labels, paused/reduced-motion behavior, and missing-artifact empty states. Test the documented demo in the production build.

### 16.3 Evaluation evidence

Use a labeled fixture set with counting unit **sensitive argument plus rule**. Group multiple input sources into that unit. Define labels before recording predictions. Report true/false positives and negatives, precision/recall when denominators exist, and known false alarms from conservative structural paths.

Exclude invalid/incomplete runs from completed-analysis accuracy counts and report their counts separately. Record analyzer/language version, fixture identity, machine/browser/runtime, effective limits, repeated-run procedure, and raw measurements for timing claims. Small educational fixtures do not establish production security effectiveness.

## 17. Acceptance Criteria and Traceability

Each criterion refers to the numbered required behaviors and relevant detailed sections. All criteria require evidence before release.

- **AC-01 (R-01–03, R-08–10):** A valid fixture yields inspectable tokens, AST, symbols, graph, converged states, and matching source references.
- **AC-02 (R-08, R-18):** Invalid character, unterminated string, malformed expression, unresolved name, invalid type/signature, and approved initialization-rule failures produce blocking source-linked diagnostics, with downstream stages unavailable.
- **AC-03 (R-05, R-10–11):** Direct and transitive input-to-query/shell flows yield one finding per sensitive argument/rule with correct contributing sources.
- **AC-04 (R-10):** Trusted literals and trusted overwrites remove appropriate explicit taint; merging paths retains every possible input contribution under the approved structural analysis.
- **AC-05 (R-09–10):** Loop fixtures account for zero iterations, repeated updates, and stable source IDs; worklist converges or reports a limit explicitly.
- **AC-06 (R-05):** An untainted `sql_bind` template with a tainted bound value yields no query-text finding; a tainted template does. Placeholder checks match resolved OD-03.
- **AC-07 (R-06, R-11–12):** Findings select source/graph/explanation consistently; loops do not cause infinite provenance walks; complete replay reaches final recorded states.
- **AC-08 (R-12, R-17):** Trace/explanation limits are visibly distinguished from solver completion and do not erase findings.
- **AC-09 (R-04, R-17):** New, running, empty, completed, invalid, cancelled, incomplete, internal-error, and stale states have the documented actions and wording.
- **AC-10 (R-15, R-17):** Edit/reanalysis/cancel races cannot attach an old result or marks to a new snapshot; duplicate requests/messages cannot mix runs.
- **AC-11 (R-13–16):** GUI/CLI outputs agree on semantic results; structured reports validate against the shared schema; exit behavior and readable export are documented and tested.
- **AC-12 (R-14):** Ordinary analysis performs no automatic source persistence/upload; file replacement protects unsaved text; exports contain the selected analyzed snapshot.
- **AC-13 (R-07, R-18–20):** Model operations never execute, HTML-like labels render as text, and approved resource limits fail cleanly.
- **AC-14 (R-19–20):** Reference-workload measurements satisfy the approved OD-08 budgets or an explicit budget revision is approved; no unexecuted results are presented as measurements.
- **AC-15 (R-04, R-06):** Graph layout failure preserves findings/inspectors and offers the documented fallback; reduced-motion and text labels keep explanations usable.
- **AC-16 (R-20):** A clean setup reproduces local UI, CLI, and the unsafe-to-bound-query demonstration using documented commands and locally packaged assets.
- **AC-17 (R-01–20):** Every applicable required behavior has a test/demo/report artifact; no architecture-affecting decision remains unresolved in the approved implementation plan.

A completed run without findings uses “No unsafe flows detected by the supported analysis.” Cancelled/invalid/incomplete runs cannot use that verdict.

## 18. Implementation Phases and Feature Dependencies

1. **Requirements gate:** Resolve OD-01–09, approve scope and language semantics, then create a separate deterministic implementation plan with exact files, interfaces, algorithms, versions, and tests.
2. **Contracts and front end:** Freeze schemas/spans/configuration; implement lexer, parser, symbols, and semantic checks. Exit gate: valid/invalid fixtures and stable source mapping.
3. **Graph and solver:** Build CFG, explicit-taint domain, transfer rules, convergence, and final findings. Depends on resolved symbols/semantics. Exit gate: branch/loop and sink fixtures pass.
4. **Explanations, replay, and adapters:** Add bounded provenance, update traces, serializer, CLI, and cancellation transport. Depends on stable engine results. Exit gate: contract tests, CLI parity baseline, and limit/error outcomes.
5. **Visual workspace:** Add editor, graph, findings, inspectors, examples/help, state machine, snapshot matching, and export. Depends on source spans, request protocol, provenance, and trace schema. Exit gate: visual demo and race/error/fallback flows pass.
6. **Release validation:** Production build, fresh-install verification, performance/security/accessibility checks, evaluation evidence, and submission report. Depends on all release criteria and approved limits.

Build and verify the command-line engine before presentation polish. Saving/export depends on snapshot identity and serializer; replay depends on recorder and bounded events; highlighting depends on spans and reference integrity; safer-query comparison depends on approved sink/template semantics.

These phases guide implementation order. They are not implementation code or authorization to build.

## 19. Assumptions, Risks, and Open Decisions

### 19.1 Assumptions

- **A-01:** A small custom language is acceptable to the course; not yet confirmed.
- **A-02:** A compiler front end plus static analysis satisfies the assignment without code generation; not yet confirmed.
- **A-03:** A local desktop browser/CLI demo is acceptable; not yet confirmed.
- **A-04:** One user works on one program at a time; no account/history features are needed under the current proposal.
- **A-05:** TypeScript/browser-worker implementation is compatible with the team's skills and course rules; not yet confirmed.

Deadline, team size, report format, and available development time are unknown; no schedule is invented.

### 19.2 Open-decision register

- **OD-01 — Course/product fit:** Confirm custom language, required code-generation coverage, and deliverables. Impact: project architecture and academic acceptance. Gate: before implementation planning.
- **OD-02 — Language semantics:** Resolve grammar, scope, initialization, operator behavior, and short-circuit/eager evaluation. Impact: AST, CFG, type/taint rules, diagnostics, fixtures. Gate: before front-end design is frozen.
- **OD-03 — Binding validation:** Resolve literal/dynamic placeholder behavior and diagnostic blocking rules. Impact: API semantics and what a “safe binding” demonstration proves. Gate: before sink rules/fixtures are frozen.
- **OD-04 — Execution architecture:** Confirm shared TypeScript/browser worker/CLI or local backend, UI delivery, cancellation, and transport. Impact: security boundaries, data movement, deployment. Gate: before schemas/adapters/file layout are frozen.
- **OD-05 — Dependency/course constraints:** Confirm language, parser-generator rules, library usage, package manager, versions/licenses, and hand-built core requirements. Gate: before dependency installation or implementation.
- **OD-06 — Data contract conventions:** Freeze spans/Unicode/newlines, stable ID scheme, result/protocol schemas, CLI flags/exit codes, structured/readable report format, and partial-artifact policy. Gate: before cross-component interfaces are implemented.
- **OD-07 — Persistence:** Confirm no autosave/history or specify recovery/retention/deletion. Impact: data schema and privacy. Gate: before file/recovery flows are implemented.
- **OD-08 — Budgets and limits:** Approve workload, reference machine/browser, proposed timing limits, source/graph/solver/trace caps, provenance/report/memory caps, and fallback threshold. Gate: before configuration and performance acceptance are frozen.
- **OD-09 — Delivery:** Confirm deadline/team/report requirements, supported environments, CI, release package, and license. Public hosting remains separate authorization. Gate: before delivery plan and release criteria are frozen.

### 19.3 Risks and mitigations

- Scope growth: keep one top-level program and modeled operations; approve extensions explicitly.
- Misleading conclusions: label conservative explicit-flow results and model limitations; do not claim exploit feasibility.
- Branch false alarms: expose merge facts and include limitation fixtures.
- Language inconsistency: resolve semantics before fixtures/interfaces; one engine powers all adapters.
- UI hiding correctness defects: establish engine fixtures before animations.
- Unbounded loops/provenance: finite source domain, monotone transfers, bounded work/trace, cycle detection.
- Source/privacy leaks: local processing, text-only rendering, explicit save/export, no default source logging.
- Weak performance evidence: benchmark approved workloads separately for analysis and rendering.
- Course mismatch: resolve OD-01/OD-05 before building.

## 20. Submission Artifacts

Provide the working local application and CLI; core source code; dependency lockfile and installation/run instructions; language specification; architecture/algorithm documentation; tests and labeled fixtures; raw/reproducible evaluation measurements; sample reports; demonstration screenshots/recording; and the assignment report describing decisions and limitations.

Maintain `decision_log.md`, `context_handoff.md`, and `status_update.md` throughout. A future resume statement may describe implemented algorithms and measured results only after verification.

## 21. PRD Completeness Review

Version 0.2 explicitly covers component responsibilities, data/control flow, schema/models, database non-requirement, logical APIs and request/result behavior, frontend views/components/navigation, interactions/states, service boundaries, authentication/permissions, validation/errors/security, configuration/dependencies, recommended technologies, performance/scalability/reliability, deployment, testing/acceptance, phases/order, assumptions/constraints/dependencies, risks, and open decisions.

Contradictions reviewed:

- Local processing is compatible with API contracts because transport need not be HTTP.
- No database is proposed even though SQL operations are modeled.
- Tainted binding values remain tainted while the query-text sink treats arguments differently.
- Dynamic placeholder validation is unresolved explicitly rather than claiming exact checking without value analysis.
- Graph explanation is possible provenance, not proof of a feasible path.
- Replay truncation is distinct from incomplete analysis.
- Stale editor content is distinct from an exportable previous source snapshot.
- Short-circuit evaluation and initialization rules are explicit planning blockers.
- Recommended budgets/stack are not approved choices or achieved measurements.

Review limitations: this is a document consistency review, not runtime validation. OD-01–09 remain unresolved and block affected implementation work. The deterministic plan must settle them before implementation starts.

## 22. Reference Sources

- [Clang taint analysis configuration](https://clang.llvm.org/docs/analyzer/user-docs/TaintAnalysisConfiguration.html): reference for source/propagation/sink modeling, not a FlowGuard dependency or equivalent-capability claim.
- [React Flow component documentation](https://reactflow.dev/api-reference/react-flow): candidate graph interaction library.
- [Monaco Editor](https://microsoft.github.io/monaco-editor/): candidate code editor.
- [MDN: Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers): candidate worker messaging and background execution mechanism.
- [MDN: Worker termination](https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate): cancellation mechanism relevant to the recommended worker architecture.
