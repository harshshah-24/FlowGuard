# FlowGuard architecture — compiler and bounded runtime

The compiler core is portable TypeScript. The browser and Node CLI supply file I/O, exact-source hashing, clocks, cancellation, and reporting. No application backend, persistence, database, or real SQL/shell service is involved.

## Implemented static pipeline

`analyzeSource` in `packages/core/src/analyze.ts` validates the request, tokenizes exact source, parses an AST, checks scopes/types, lowers a typed instruction graph, solves explicit may-taint, and constructs bounded final-state explanations. It retains artifacts only after their stage finishes. Source errors, limits, cancellation, and internal errors have distinct statuses.

The coordinator now continues through typed bytecode generation and verification. Only after every stage succeeds does it publish final findings, bytecode and disassembly with completed status. Source errors, cancellation, limits or internal failures retain safe completed static artifacts while withholding those final artifacts. Analyze is enabled for nonempty source; Run requires a current completed bytecode artifact and valid inputs.

Static-module callers use `solveTaint`, `collectFindings`, and `buildProvenance` directly for independent fixture tests. Findings in the integration harness are real module outputs, clearly labeled development artifacts, separate from release AnalysisResult/report completion.

## Fixed-point solver

Every reached state has one immutable, sorted source-index set per typed slot. A membership-deduplicated FIFO queue begins at graph entry. A pop unions reached predecessor outputs, applies the instruction transfer, and schedules successors in instruction order only when reachability or output changes. Constants clear a destination, input creates its static source singleton, copy/unary propagate a set, binary unions sets, and control/effect instructions preserve state. Assignment kills earlier taint. Condition taint never becomes implicit control taint.

The finite slot/source identities guarantee a finite lattice. Both structural branch alternatives remain, including constant conditions and short circuits; findings are possible explicit flow, not proof of a feasible attack. Sensitive argument zero is checked after convergence for sql_query/sql_bind and shell. A bound value alone is not query-text taint. Print is not a sink.

Before per-node allocation, the solver checks twice nodes times slots against 4,000,000 state cells. Retained input/output source memberships are counted conservatively without discounts for sharing, checked against 2,000,000 before replacing states. Work is capped at 200,000 pops and the shared 10-second compilation deadline.

## Explanations and replay

`buildProvenance` follows final-state dependency facts backwards from sensitive argument contributions. Explicit iterative traversal, visited keys, and cycle markers prevent recursive or repeated-path expansion. Fact IDs are deterministic and shared; global facts cap at 20,000 and each finding displays at most 200. Truncation never removes contributing source IDs and marks the explanation incomplete. Fragments and merges are not presented as one feasible execution.

`ReplayRecorder` retains changed output/reachability deltas, an initial checkpoint, and a checkpoint every 100 recorded updates. States/checkpoints share immutable unchanged data. JSON UTF-8 byte accounting occurs before retention. At 10,000 events or 8 MiB, recording stops and omitted updates are counted while the solver continues. Apply/undo and nearest-checkpoint reconstruction are available. Replay means analysis updates; final static states are a separate view.

## Browser boundaries and presentation

`AnalysisClient` creates one bundled module worker per request. It validates versioned messages, request ID, revision, exact source and snapshot hash identity, and accepts only one terminal result. Cancellation invalidates identity before termination. Old-worker messages are ignored before parsing. Worker startup, postMessage, decoding, malformed messages and crashes become WORKER_FAILED; the 10,250 ms watchdog returns an incomplete limit and terminates the worker. The worker recomputes SHA-256 before invoking the core.

`LayoutClient` has an independent identity and a two-second watchdog. A Dagre worker computes top-to-bottom layout with 180×64 nodes, rank separation 70 and node separation 30. React Flow is view-only and retains every semantic edge. More than 200 nodes, a failed/malformed layout, or a timeout uses the searchable, paginated node/edge list; layout does not alter the compiler result. Source, graph and finding selections share source spans. Inspector rows are expandable and paginated at 100; selected-node states paginate by slot instead of rendering an entire state table at once.

The workspace reducer guards stale results and layout, retains immutable previous-snapshot exports, and clears selections/marks on edits. Final states and replay updates have explicit separate modes. Autoplay advances every 400 ms, stops at the recorded end, cancels on edits, and is disabled by reduced-motion preference.

## Reports and CLI

JSON/Markdown export validates the report envelope and any runtime identity. An iterative capped writer escapes strings in bounded chunks and checks every UTF-8 chunk before retaining it, enforcing 16 MiB before joining. Markdown fences exceed embedded backtick runs in source, diagnostic and runtime text. JSON preserves full selected artifacts; Markdown includes exact source, diagnostics, limitations, compiler summaries, completion/version/identity, limits and statistics. Neither report path imports executable data.

CLI parsing has a fixed flag set, duplicate/unknown/missing-value validation, bounded fatal UTF-8 file reads, input JSON validation, exclusive output creation, and explicit overwrite. Progress is throttled on stderr; stdout remains report-only. --run executes only a completed analysis. Runtime failure takes precedence over findings and still includes the completed static report. A Node worker runs the synchronous core while main-thread SIGINT updates a shared atomic cancellation flag.

## Integration validation boundary

Normal builds include only `index.html`. The `phase2-test` Vite mode additionally builds `test/phase2.html` into ignored `.vite/phase2-dist`. That clearly labeled harness computes real static artifacts and exercises the actual bundled analysis/layout/Monaco workers and presentation components. It is absent from `apps/web/dist`, uses synthetic sources only, and has no release URL flag to enable mocks or raise limits.

Full release evaluation, benchmarks and submission evidence belong to Phase 4. Phase 3 is complete locally, including the approved scope-metadata amendment.

## Bytecode and verifier

Each lowered instruction emits balanced typed stack operations with an empty stack at IR boundaries. Typed constants deduplicate in first-use order. Two-pass generation patches jumps to IR start PCs; every emitted instruction maps to its IR/AST/source span. INPUT operands index a numerically ordered static source table.

Verification validates the strict schema/version, operand references/types, source table, source-map coverage and snapshot identity. Reachable stack types propagate from an empty entry stack and must agree at joins. Definite initialization runs separately as a greatest fixed point: entry includes an external empty set; other reached nodes start with the full slot universe; predecessor outputs intersect and STORE adds its slot. Bounded bitsets reduce retained memory. LOAD checks happen only after convergence. Each pass has its own 200000-visit cap and shares the compile deadline.

## Execution and current boundary

The VM verifies again before execution. It uses typed scalar slots/stack, encounter-order supplied inputs and exact BigInt-backed int32 arithmetic. Division truncates toward zero; remainder follows the dividend. Zero divisors and overflow are runtime errors. Only HALT completes. String sizes and aggregate slot/stack string storage are checked before retention; references count conservatively. Events are simulated and bounded by count and serialized bytes. Runtime errors/limits retain preceding events.

ExecutionClient creates a fresh bundled execution worker per run, validates request/snapshot/revision identity, ignores stale/duplicate results and terminates on Stop/source/input edit/error. An independent 1250 ms watchdog guards the core's 1000 ms deadline. Runtime failure leaves static findings/bytecode available. Kill/watchdog outcomes have no recoverable worker-local event history. Runtime and bytecode rows paginate at 100; selection links source/graph. Text payloads render as text.

The approved required topLevelSymbolIds field carries final HALT lexical visibility in symbol order. Strict validation rejects missing/duplicate/unordered IDs and references outside user slots. The VM projects only initialized values after execution, including core-reported errors, limits and cancellation; unverified requests expose no values. Block locals, temporaries and unreached declarations are omitted. Core, CLI and real-worker browser tests verify this behavior.
