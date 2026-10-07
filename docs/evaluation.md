# Evaluation and performance evidence — 7 October 2026

## Independent fixture evaluation

`fixtures/evaluation.json` fixes expected statuses, diagnostic codes, sensitive argument/rule units and contributing sources before predictions are collected. `scripts/evaluate.ts` runs the real full analyzer. The counting unit is one modeled sensitive argument zero and rule at a specified source line. Invalid programs are counted separately, not treated as true negatives. Incomplete analysis is separate and fails the correctness gate. Unexpected findings and attribution/status/diagnostic mismatches also fail it.

Twenty fixture programs include twelve valid programs and eight invalid programs. The valid cases contain fourteen labeled sink units. Actual results in [evaluation.json](evidence/evaluation.json):

- True positives: **6**; false positives: **2**; false negatives: **0**; true negatives: **4**.
- Precision: **6 / 8 = 75%**; recall: **6 / 6 = 100%**.
- Invalid programs: **8**; incomplete results: **0**; expectation/attribution mismatches: **0**.

Two structurally infeasible cases are independently labeled negative: a sink after an unconditional infinite loop, and tainted assignment inside `if(false)`. The analyzer intentionally retains those structural alternatives and reports both, so both are false positives in these accuracy counts. They are also recorded as a separate subset: TP0/FP2/FN0/TN0, precision0, recall undefined. The other subset has TP6/FP0/FN0/TN4, precision1 and recall1. Neither the infeasible cases nor invalid inputs are silently removed to improve the headline metrics.

These small synthetic fixtures demonstrate specified behavior, not production scanner accuracy. The language models explicit flow only, no implicit control flow or general feasibility proof. Each sink unit is intentionally placed on its own line in these fixtures; the evaluator's line/rule matching is not a general label format for multiple identical sinks on one line.

## Benchmark protocol

`npm run benchmark` compiles and runs `scripts/benchmark.ts`; first build and keep `npm run preview` running at http://127.0.0.1:4173. Stop competing tests before measuring.

Twenty workloads are generated before measurements by the fixed LCG seed **5012026**, using arithmetic, branch, loop, string and query/binding variants. Every workload is checked against the approved bounds before timing: at most 1,000 nonblank lines, 500 actual lowered nodes and 50 input occurrences. Actual programs have **79–126 nonblank lines, 242–452 lowered nodes and one input occurrence each**. They are not worst-case tests for every allowed cap.

Each engine workload receives one warm-up plus ten measured full analyses with replay enabled. Measurements surround the complete core call; stage durations are retained separately. The nearest-rank p95 sorts samples and selects `ceil(0.95 * N) - 1`. Per-workload p95 and all 200 samples are retained; the aggregate p95 is also reported. Source text, SHA-256, seed, counts and statuses make the workloads reproducible.

The browser uses a separately checked **exactly 200-node** program. Graph readiness starts at Analyze's click handler and ends after completed analysis and rendered graph nodes, including source hashing, compilation, worker transport, layout and rendering. The separately recorded layout/render interval runs from the completed-analysis DOM update to rendered graph nodes; it includes transport/rendering and is not pure Dagre CPU time. Bytecode-row selection measures the click handler to visible source selection. Analysis cancellation measures Cancel to its displayed cancelled footer. VM Stop is automatically clicked as soon as React exposes it: the VM can exhaust its instruction cap before Playwright finishes actionability checks. This records DOM click-to-visible response, not human reaction time. Browser-driver observation overhead is included in the observed samples.

Every browser path has one warm-up and ten measured samples. These are repeatable latency checks in headless Chromium, not universal interactive or cold-start guarantees.

## Actual machine and results

Recorded machine: **Apple A18 Pro, arm64, six logical CPUs, 8 GiB RAM, Darwin 27.0.0**, Node **26.5.0**, npm **11.17.0**. Browser: Playwright Chromium **153.0.8010.12**, viewport **1280 × 800**. Measurement timestamp is stored in UTC with Asia/Kolkata as local timezone metadata. It identifies the development Mac, not a faculty-specified demo computer.

Actual p95 values from [benchmark.json](evidence/benchmark.json):

- Engine aggregate: **938.8 ms**; every individual workload also passed the **2,000 ms** target.
- Full 200-node graph readiness: **1,282.5 ms**, target **2,000 ms**.
- Separate layout/render interval: **82.5 ms**, included in graph readiness.
- Selection: **34.9 ms**, target **250 ms**.
- Visible analysis cancellation: **3.2 ms**, target **250 ms**.
- Visible VM cancellation: **12.5 ms**, target **250 ms**.

**All approved targets passed without changing limits, targets or selecting workloads from observed results.** Raw engine-only measurements are also saved in [benchmark-engine.json](evidence/benchmark-engine.json). CI runs deterministic evaluation and functional checks; it does not enforce hardware-sensitive benchmark timing.

## Evidence provenance and reproduction

The measurements were made on local Phase 4 changes based on published commit `3a7678c`. They honestly record `workingTreeChanged: true`; they are not represented as timings for an already published Phase 4 commit. Evidence includes hashes of core, CLI, UI, scripts, label files and the lockfile, plus an aggregate source-tree checksum. Reproduction may produce different wall-clock times; labels, seed and input checksums remain fixed.

`npm run evaluate` regenerates actual unsafe-query, bound-query and runtime-error JSON/Markdown reports. The first two consume synthetic `Ada`; the third records a runtime error. [Demo evidence](evidence/demo.json) records real production Analyze/Run, blocked remote origins and zero browser errors. [Unsafe screenshot](evidence/unsafe-query-workspace.png) and [binding screenshot](evidence/bound-query-workspace.png) were visually inspected: source, graph, findings, replay, bytecode, supplied input and runtime agree. No private source or invented runtime payload is included.
