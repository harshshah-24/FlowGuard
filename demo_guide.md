# FlowGuard faculty demonstration guide

Prepared against the current source on 11 October 2026. Use this guide to rehearse the presentation; use [architecture_guide.md](architecture_guide.md) for implementation questions and [pcd_guide.md](pcd_guide.md) to learn the compiler concepts.

## 1. What to say when introducing the project

> “FlowGuard is a visual compiler and static analyzer for a small programming language we designed. It checks the program, builds a control-flow graph, tracks possible user-input flow into SQL or shell text, and generates verified bytecode. We can then run that bytecode in our own bounded virtual machine. The interface connects the source to the compiler artifacts, findings, analysis replay, and runtime results.”

Explain the motivation in everyday terms:

> “Compiler stages are usually taught separately. We wanted to show how they connect in one working system. Our practical use case is identifying where user-controlled data can reach sensitive operations.”

Clarify the demo boundary once: SQL and shell events are simulations. The program does not query a database or execute system commands. Findings describe possible explicit flows, rather than confirmed attacks.

## 2. Prepare before faculty arrive

### Start the application

Open a terminal in the repository root. Use Node **26.5.0** and npm **11.17.0**, as pinned by this project:

```powershell
node --version
npm --version
```

On this Windows machine, a previously installed project toolchain is available at the path below. This is an optional, machine-specific alternative if the commands above select the older system versions. It changes PATH only for this terminal; on another computer, use its installed matching toolchain.

```powershell
$flowguardToolchain = Join-Path $env:TEMP 'flowguard-toolchain\node-v26.5.0-win-x64'
$env:Path = "$flowguardToolchain;$env:Path"
node --version
npm.cmd --version
```

For a prepared installation, build and serve the production bundle:

```powershell
npm.cmd run build
npm.cmd run preview
```

Open **http://127.0.0.1:4173/** and keep that terminal running. On a fresh checkout, run `npm.cmd ci` before building. Installation needs network access; do it before the presentation. The production preview serves the already built application locally.

For development, `npm.cmd run dev` serves **http://127.0.0.1:5173/**. Use the URL printed by the command; do not confuse the development and production-preview ports.

### Rehearsal checklist

- Use a desktop viewport and browser zoom that makes source and graph labels readable.
- Verify that Analyze finishes and that the graph, Inspection tabs, bytecode, and Runtime panel are visible.
- Keep this guide open separately so snippets are ready to paste.
- Save any source draft you want to retain. Drafts live only in memory and disappear on reload.
- When loading an example over a dirty draft, use the replacement dialog's save/discard/cancel choice deliberately.
- Enter runtime inputs explicitly for every example. Loading an example does **not** populate its inputs automatically.
- If editing in Monaco, click inside the source editor before using Ctrl+A. Ctrl/Cmd+Enter triggers Analyze.
- Test all three demonstrations on the actual presentation computer. The core checks described at the end do not establish a human rehearsal or verify that computer's browser.

## 3. Suggested presentation order and teammate handoff

| Time | Present | Explain |
|---|---|---|
| 0–1 min | Introduction and workspace | The problem, small language, Analyze versus Run. |
| 1–5 min | Demo 1 | Compiler artifacts, unsafe query flow, binding, bytecode and execution. |
| 5–8 min | Demo 2 | Branch merges, loop backedges, static sources versus runtime inputs. |
| 8–11 min | Demo 3 | Syntax/type/runtime errors, recovery, bounded execution. |
| 11–13 min | Architecture and questions | Shared core, browser workers, verifier, limitations. |

Suggested division: presenter A introduces the language and compiler frontend; presenter B explains taint analysis, bytecode, and the VM. Both should be able to explain the complete pipeline. Switch presenters at a visible artifact, such as the graph or bytecode panel, rather than stopping to discuss implementation ownership.

If faculty give only five minutes, show Demo 1 fully, one loop graph from Demo 2, and the division-by-zero part of Demo 3.

## 4. Demo 1 — Trace an unsafe query, then separate its input value

**Goal:** show the complete journey from source to compiler artifacts, a finding, verified bytecode, simulated execution, and an exported report. Then make a meaningful source change and reanalyze it.

### A. Load the unsafe program

Select **Examples → Load Unsafe query**, or paste this exact source into the editor:

```fg
let name: string = input("Name");
let query: string = "SELECT * FROM users WHERE name = " + name;
sql_query(query);
```

Say:

> “The first line reads text. The second joins that text into a query. The third represents a database operation. We will analyze whether user input contributes to the query text.”

### B. Analyze and show the intermediate results

1. Select **Analyze** and wait for `Analysis: completed`. A successful analysis completes all **9/9** stages.
2. In **Inspection → tokens**, expand a few rows. Point out `LET`, `IDENTIFIER`, `TYPE_STRING`, and string literals. These are the pieces recognized by the lexer.
3. In **Inspection → ast**, expand the declaration and concatenation nodes. Explain that the parser has converted a sequence of tokens into a structured tree.
4. In **Inspection → symbols**, show `name` and `query`, their types, scopes, and storage-slot identities.
5. Show the graph's Input node and `sql_query` Sink node. Edges represent possible **execution order**; the graph is a control-flow graph, not a diagram containing only data dependencies.
6. Under **Possible explicit flows**, select **`SQL_QUERY_TEXT · 3:1`**. The sink's source span is highlighted, its graph node is selected, and its supporting facts become visible.
7. Select **Inspection → states** with the sink selected. Look up the slot corresponding to `query`: its incoming source set contains `src-0`.

Expected result: **one finding**, associated with the sole syntactic input source `src-0`.

Say:

> “The analyzer follows input through assignment and concatenation. It knows the query text may contain data from this input operation. It does not need a malicious input value to discover that connection.”

### C. Replay the analysis and inspect bytecode

1. Select **Reset replay**, then **Next update** several times. Explain that these are updates to the analyzer's knowledge.
2. Select **View final analysis** before explaining the final source sets.
3. Scroll to **Verified bytecode**. Select a `LOAD`, `CONCAT_STRING`, or `SQL_QUERY` row and show its source/graph selection.

Say:

> “Replay shows the solver processing the graph; it is not the program executing. Bytecode is the lower-level instruction language our VM can execute.”

### D. Run with concrete input and export

In **Runtime inputs**, enter:

```json
["Ada"]
```

1. Select **Run**.
2. Expand the Runtime `input` and `sql-query` events.
3. Show `Execution: completed` and the final top-level values.
4. Select **Export Markdown** while this result is current. Open the downloaded report to show the exact analyzed source, finding, bytecode, and simulated execution.

Expected runtime values:

| Item | Value |
|---|---|
| Inputs consumed | 1 |
| Query event | `SELECT * FROM users WHERE name = Ada` |
| Final `name` | `Ada` |
| Final `query` | `SELECT * FROM users WHERE name = Ada` |

The event contains `simulated: true`. This example demonstrates input flow; the SQL text is not parsed or sent to a database.

### E. Change to binding and repeat the pipeline

Replace the whole program with the built-in **Parameter binding** example, or paste:

```fg
let name: string = input("Name");
sql_bind("SELECT * FROM users WHERE name = ?", name);
```

1. Point out that the edit makes the previous analysis stale and disables Run until Analyze is repeated.
2. Select **Analyze**. Expect **zero modeled explicit-flow findings**.
3. Confirm inputs are still `["Ada"]`, then select **Run**.
4. Expand the `sql-bind` event: its template and typed bound value are separate.
5. Export this result if you want an unsafe-versus-binding comparison for faculty.

Say:

> “The input is still untrusted, but it is passed as a separate value. Our rule checks the query template, not the bound value. The literal template does not contain input, so this modeled query-text finding disappears.”

Avoid calling this a proof that all SQL usage is safe. FlowGuard models a small set of operations and does not implement a full SQL parser.

## 5. Demo 2 — Compare branch and loop analysis with actual execution

**Goal:** explain why analysis considers multiple structural paths and why loop analysis differs from running loop iterations.

### A. Analyze a branch merge

Load **Branch merge**, or paste:

```fg
let text: string = "trusted";
if (true) { text = input("Value"); } else { text = "literal"; }
shell(text);
```

1. Select **Analyze**. Expect one **`SHELL_COMMAND_TEXT · 3:1`** finding with `src-0`.
2. Show the graph's `true` and `false` edges and where the alternatives rejoin.
3. Select the sink and inspect its incoming `text` slot. The merged set includes input from the input-containing branch.
4. Enter the following runtime inputs and select **Run**:

```json
["echo example"]
```

Expected: one input event, one simulated shell event with command `echo example`, and final `text = "echo example"`.

Say:

> “At a merge, static analysis combines the sources that could arrive from either structural predecessor. Actual execution follows the branch selected by the condition.”

### B. Make the branch infeasible and explain the warning

Change only `if (true)` to `if (false)`, then reanalyze and run with the same inputs:

```fg
let text: string = "trusted";
if (false) { text = input("Value"); } else { text = "literal"; }
shell(text);
```

Expected results:

- Analysis still reports **one** `SHELL_COMMAND_TEXT` finding with `src-0`.
- Runtime consumes **zero** inputs; the supplied value is unused.
- The simulated shell command and final `text` are `literal`.

Say:

> “Our analysis keeps both structural branches, even with a constant condition. This warning is a deliberate conservative false alarm. The runtime follows the false branch, so it never reads the input. This shows exactly what our analysis can and cannot establish.”

### C. Show a loop and repeated input

Load **Loop input flow**, or paste:

```fg
let i: int = 0;
let text: string = "initial";
while (i < 2) { text = input("Value"); i = i + 1; }
sql_query(text);
```

1. Select **Analyze**. Show the loop test, true/false edges, and `loop-back` edge.
2. Expect one **`SQL_QUERY_TEXT · 4:1`** finding with `src-0`.
3. Select a loop node, reset replay, and advance updates. Explain that the solver revisits affected nodes until their source sets stop changing. Do not promise a particular number of updates for each loop iteration.
4. Select **View final analysis**.
5. Enter inputs and Run:

```json
["one", "two"]
```

Expected: two input events, both referring to the same static source `src-0`; one simulated query event with text `two`; final values `i = 2` and `text = "two"`.

Say:

> “There is one input expression in the source, so there is one static source identity. Execution reaches it twice and consumes two supplied values. Fixed-point analysis computes possible flow; VM execution performs the actual iterations.”

Export the loop result after Run to capture both the finding and concrete events.

## 6. Demo 3 — Distinguish syntax errors, type errors, and runtime failures

**Goal:** demonstrate that the compiler stages have different responsibilities and that a valid compiled program can still fail while running.

### A. Begin with a successful arithmetic program

```fg
let result: int = 12 / 3;
print(result);
```

Analyze, enter `[]` in Runtime inputs, and Run. Expect zero findings, a typed print event with value `4`, and final `result = 4`. Show `DIV_INT` in bytecode.

### B. Introduce a syntax error

Remove the declaration's semicolon:

```fg
let result: int = 12 / 3
print(result);
```

Analyze. Expect `invalid-source` with **`PARSE_EXPECTED`**. Inspect the tokens: the lexer succeeded, but the parser could not match the declaration grammar. Run is disabled and no final bytecode is published.

Say:

> “The words and symbols are recognizable, but their arrangement does not follow our grammar.”

### C. Introduce a semantic error

Restore the semicolon and assign text to an integer:

```fg
let result: int = "twelve";
print(result);
```

Analyze. Expect `invalid-source` with **`SEM_TYPE`**. Tokens and AST exist because lexical and syntax analysis completed. Semantic checking rejects the mismatched initializer; Run stays disabled.

Say:

> “This statement has valid syntax, but an integer variable cannot hold text.”

### D. Introduce a runtime error

Change the program to:

```fg
let result: int = 12 / 0;
print(result);
```

1. Analyze. Expect `completed`, zero findings, and verified bytecode.
2. Use inputs `[]` and select Run.
3. Expect `runtime-error` with **`RUNTIME_DIV_ZERO`**, no print event, and no initialized final `result` value. Division fails before the declaration stores its result.
4. Point out that the completed static analysis and bytecode remain available.
5. Export Markdown to show a completed analysis together with a failed execution.
6. Restore divisor `3`, Analyze, and Run again. Expect completion and printed value `4`.

Say:

> “Our type checker confirms that these are integer operands. It does not evaluate the division or prove the divisor nonzero. The VM detects the arithmetic error during execution.”

### E. Optional bounded-execution extension

```fg
while (true) {}
```

Analyze and Run with `[]`. Allow it to finish with `incomplete-limit`: the VM reaches its instruction/time limit instead of running indefinitely. The precise limit hit can depend on the machine.

If showing **Stop execution**, click it while a run is active. This small loop may finish its budget before you can click; if so, explain the observed limit result. A successful Stop terminates the worker and reports cancellation. Forced termination cannot recover that worker's local events or values.

## 7. Questions faculty may ask

| Question | Answer to give |
|---|---|
| What did you implement yourselves? | The lexer, parser, scope/type checker, lowering, data-flow solver, findings/provenance, replay recorder, bytecode generator, verifier, VM, and integration. |
| What do libraries provide? | React provides the UI, Monaco the editor, React Flow the graph view, Dagre node positions, and Zod contract validation. They do not implement our compiler or taint solver. |
| Is this a compiler or a security analyzer? | Both: a compiler for our small language, with a data-flow analysis pass before bytecode generation. |
| Does it analyze Python/C/Java? | It analyzes our `.fg` language. Extending it requires language and analysis changes. |
| Why are there nine stages? | `validate`, `lex`, `parse`, `semantic`, `lower`, `taint`, `findings`, `codegen`, `verify`. The count includes request validation and project-specific analysis passes. |
| Why can it warn about `if (false)`? | The analysis follows structural CFG alternatives and does not remove infeasible branches or solve conditions. |
| Does zero findings mean the program cannot fail? | No. Findings concern modeled explicit input flow; runtime arithmetic errors are a separate issue. |
| Does zero findings prove security? | No. Implicit flows and arbitrary library/SQL/shell behavior are outside the model. |
| Does Run execute SQL or shell commands? | It records simulated events only. |
| How does a loop analysis terminate? | It propagates finite source sets monotonically until a fixed point, subject to work, storage, and time limits. |
| Why verify bytecode? | To reject invalid references, inconsistent stack types, and reads of storage that is not definitely initialized. The VM verifies again before execution. |
| What happens after an edit? | The analysis becomes stale, marks/runtime results are retired, and Run requires fresh completed analysis. |
| Where is the backend/database? | Analysis and execution happen in browser workers or through the Node CLI using the same core. No application backend or persistence is needed. |

## 8. Closing statement

> “The project connects compiler stages to a practical analysis problem. We can explain a possible input flow, inspect the generated instructions, and compare that static result with a concrete bounded execution. The interface makes each stage traceable to the original source.”

## 9. Verification and evidence boundary

On **11 October 2026**, verification passed with Node **26.5.0** after rebuilding the core and CLI with npm **11.17.0**:

- All **10 source snippets** within the three demonstrations matched their documented analysis statuses, findings/source identities, runtime events, and final values.
- All **10 additional source snippets** in the PCD guide matched their explained behavior.
- **Five actual CLI invocations** confirmed the unsafe, binding, syntax-error, semantic-error, and runtime-error outcomes and exit codes.
- JSON and Markdown serialization passed for every demo outcome, including invalid source and failed execution.
- All **103 local Markdown links** across the three guides resolved before the subsequent documentation cleanup. Current links are checked separately after layout changes.

These checks do not establish a new browser rehearsal, new performance benchmark, faculty submission, or publication. Rehearse the UI steps on the presentation computer before showing faculty.

Existing browser workflow coverage is in [runtime.spec.ts](apps/web/test/runtime.spec.ts), [workspace.spec.ts](apps/web/test/workspace.spec.ts), and [release.spec.ts](apps/web/test/release.spec.ts). Earlier release evidence and the compact demo script remain in the [original repository history](README.md#historical-documentation). This submission branch omits development evaluation/benchmark/capture utilities. Use the manual demonstrations above and the application's JSON/Markdown exports when presenting.
