# FlowGuard — Product Requirements Document

**Course:** 4CS501CC25 Principles of Compiler Design

**Project:** FlowGuard — Visual Static Analyzer for Unsafe Input Flow

**Version:** 0.1

**Date:** 2026-10-04

**Document status:** Draft for review; requirements are proposed, not yet approved for implementation.

## 1. Product Summary

FlowGuard is a local tool that analyzes a small programming language and explains how untrusted input can reach sensitive operations. It combines a compiler front end, control-flow analysis, and an interactive visual explanation.

The main demonstration is simple: enter a program, analyze it, select a warning, and see how input flowed through assignments and branches into a query or command operation. Edit the program to use a modeled safer operation, analyze it again, and inspect the changed result.

The tool must expose its reasoning. A warning should be understandable from the source, graph, and variable information, without relying on an unexplained score.

## 2. Problem and Intended Users

Students often learn tokenization, parsing, and data-flow analysis separately. They need a working application that connects these concepts and shows their effect on real program-analysis questions.

Primary users are compiler-design students and evaluators. Secondary users are developers learning the basics of injection-related input flow.

FlowGuard is an educational analyzer for its own supported language. It does not claim to analyze arbitrary Python, C, Java, or JavaScript programs.

## 3. Goals

1. Demonstrate an end-to-end pipeline from source text to analysis findings.
2. Implement core compiler and analysis algorithms directly.
3. Make input propagation and compiler stages visible and interactive.
4. Provide a distinctive use case: explaining potential injection-related flows.
5. Produce reproducible correctness evidence and a complete assignment submission.
6. Support a resume demonstration grounded in implemented features and measured results.

## 4. Scope and Non-Goals

### Proposed initial release

- One small, explicitly defined language with strings, integers, and booleans.
- One top-level program with variables, assignments, expressions, conditions, and loops.
- A fixed set of modeled input, output, query, and command operations.
- Lexical, syntactic, and semantic checks.
- Control-flow graph construction and forward taint analysis.
- Interactive source-to-graph navigation and explanation of findings.
- A local graphical interface and command-line analysis using the same engine.
- Built-in examples, exported reports, tests, and documentation.

### Excluded from the initial release

- User-defined functions, recursion, classes, arrays, pointers, and heap analysis.
- Analysis across files or function calls.
- Full compatibility with an existing general-purpose language.
- Real database queries or operating-system command execution.
- General-purpose sanitizer recognition or automatic code repair.
- Symbolic execution, exact path feasibility, and proof that an exploit exists.
- Integer-range analysis, division-by-zero detection, and optimization passes.
- AI-generated analysis, accounts, cloud hosting, and collaboration features.

The earlier integer-range static-analyzer proposal is a separate alternative. FlowGuard focuses on input-flow analysis.

## 5. Core CS and Compiler Requirements

### 5.1 Lexer

Implement token recognition for the approved grammar. Preserve source locations for identifiers, literals, keywords, operators, punctuation, and comments. Report invalid characters and unterminated strings clearly.

### 5.2 Parser and Syntax Tree

Implement expression precedence and structured statements. Build an abstract syntax tree that preserves source locations. Expose the tree for inspection. Report syntax errors with the location and expected construct.

### 5.3 Semantic Analysis

Maintain a symbol table, resolve names, and check variable declarations and operand types. Validate built-in operation argument counts and types. Define and document scope and assignment rules before implementation.

Semantic errors prevent taint results from being presented as complete. Checks for reading a variable before it is initialized must have a defined treatment, including assignments in branches and loops.

### 5.4 Control-Flow Graph

Represent sequential execution, true and false branch edges, merges, loop back edges, entry, and exit. Link graph elements to source statements. A selected statement must reveal its location in the graph.

### 5.5 Taint Analysis

Track whether a value may originate from an untrusted input operation. Propagate information through expressions and assignments. Merge information conservatively across incoming paths.

Use a worklist-based forward analysis that revisits affected nodes until the results stop changing. The taint domain must be finite, and the transfer rules must support termination and conservative propagation. The implementation plan must define the domain, merge rules, transfer functions, and scheduling exactly.

Show incoming and outgoing analysis information for each graph node. Explain fixed-point computation as repeated updates until no tracked information changes.

### 5.6 Provenance and Diagnostics

Record which input sources may contribute to a sensitive argument. Present a source-linked explanation of relevant assignments and operations. Avoid describing a highlighted graph route as a proven executable attack path.

The initial analysis tracks explicit value flow. It does not treat every value assigned under an input-dependent condition as tainted solely because of that condition. Document this implicit-flow limitation.

## 6. Proposed Language and Operation Model

The exact grammar and semantics belong in the approved implementation plan. The following syntax illustrates the proposed user experience:

```text
let name: string = input("Name");
let query: string = "SELECT * FROM users WHERE name = '" + name + "'";
sql_query(query);
```

Expected finding: untrusted input may reach the SQL query-text argument.

```text
let name: string = input("Name");
sql_bind("SELECT * FROM users WHERE name = ?", name);
```

Expected result: no SQL query-text warning for the bound value. The value remains tainted; binding does not turn it into trusted data.

### Proposed built-ins

- `input(prompt)`: Returns an untrusted string. The prompt must be a string.
- `print(value)`: Accepts one string, integer, or boolean; not an injection sink.
- `sql_query(query)`: Accepts one string; a tainted query argument produces a finding.
- `sql_bind(template, value)`: Accepts a string template with exactly one modeled placeholder and one scalar bound value. A tainted template produces a finding; a tainted bound value alone does not.
- `shell(command)`: Accepts one string; a tainted command argument produces a finding.

These operations are analysis models, not connections to a database or shell. Report text must say so. The `sql_bind` syntax is an educational abstraction, not a promise of compatibility with a database driver.

### Additional proposed language behavior

- Typed declarations and assignments.
- String concatenation with `+`; no implicit conversion between strings and numbers.
- Integer arithmetic and comparisons, boolean operations, `if/else`, and `while`.
- Block structure and comments.
- Assignment of a trusted literal can overwrite a variable's earlier taint.
- Mixing trusted and tainted values in an expression propagates the relevant input sources.
- At a branch merge, taint from either incoming path is retained.
- Conservatively analyze both branch alternatives; do not claim exact feasibility.
- Loops must account for zero iterations and repeated propagation.

## 7. User Experience and Visual Requirements

### Main workspace

- A source editor with line numbers and highlighted diagnostics.
- A graph panel displaying program flow with clearly labeled branch and loop edges.
- A findings panel listing the location, sensitive operation, affected argument, contributing input sources, and explanation.
- Inspectable views for tokens, syntax tree, symbol table, and analysis states.

### Visual demonstration

1. Select a built-in unsafe-query example.
2. Analyze it and display a warning.
3. Select the warning to highlight its source, propagation steps, and sensitive argument.
4. Inspect the analysis state at a branch or loop.
5. Replace query construction with the modeled bound-query operation.
6. Analyze again and show the warning disappearing while the input remains tainted.

### Required interactions

- Click a graph node to highlight its source and show analysis information.
- Click a finding to focus the relevant source and graph elements.
- Pan, zoom, and fit the graph to the available space.
- Step through recorded analysis updates with play, pause, next, and reset controls.
- Clearly label the animation as analysis progression, not program execution.
- Switch between source examples without losing clarity about which result is displayed.
- Mark results as stale after source edits until a new analysis finishes.

Use text labels and symbols alongside colors. The graph must remain understandable when animations are paused. Prefer a readable 2D graph over decorative complexity.

## 8. Functional Requirements

- **FR-01 — Source input:** Create or edit a program, load a supported local text file, and choose built-in examples.
- **FR-02 — Analysis:** Run all supported compiler stages and taint analysis on valid input.
- **FR-03 — Errors:** Display source-linked lexical, syntax, and semantic errors; do not show a completed security result for invalid input.
- **FR-04 — Compiler inspection:** Expose tokens, syntax tree, symbol information, and control-flow structure from the same source snapshot.
- **FR-05 — Findings:** Flag tainted arguments at modeled SQL query-text and shell-command sinks.
- **FR-06 — Binding model:** Distinguish query-template taint from bound-value taint.
- **FR-07 — Explanation:** Connect findings to contributing input operations and relevant propagation information.
- **FR-08 — Analysis replay:** Show recorded analysis updates and incoming/outgoing states.
- **FR-09 — Source navigation:** Link diagnostics, graph nodes, and source locations in both directions where applicable.
- **FR-10 — Reanalysis:** Replace all results after edits and reanalysis; prevent findings from different snapshots from mixing.
- **FR-11 — Export:** Save a structured report and a readable report containing source, diagnostics, findings, limitations, analyzer version, and analysis statistics.
- **FR-12 — Command line:** Analyze a source file without the graphical interface and produce equivalent findings and structured output.
- **FR-13 — Limits:** Reject inputs beyond documented limits and report interrupted or incomplete analyses explicitly.

## 9. Non-Functional Requirements

- Core analysis must work locally without credentials or external APIs. Installation may require downloading declared dependencies.
- The analyzer must not execute supplied source programs or modeled query/command operations.
- The same source and analyzer version must produce equivalent findings with deterministic ordering.
- Preserve exact source locations across compiler stages and exported reports.
- Keep the editor responsive during analysis and report resource-limit failures clearly.
- Retain source text when analysis fails.
- A normal analysis should not write source code to disk unless the user saves or exports it.
- Target a local desktop browser experience; mobile support is outside the initial scope.
- Publish resource limits and benchmark conditions in the submission documentation.

Exact performance budgets, source-size limits, technology choices, and browser targets must be settled in the implementation plan. No runtime or accuracy claim is made in this PRD.

## 10. Acceptance Criteria

The initial release is complete only when all of the following are demonstrated:

1. A valid sample passes through lexer, parser, semantic checks, graph construction, and analysis, with inspectable artifacts.
2. Invalid character, malformed expression, undeclared name, invalid argument, and type-mismatch examples produce appropriate source-linked errors.
3. Direct `input` to `sql_query` flow produces a finding.
4. Input propagated through multiple assignments and concatenation produces a finding identifying the contributing source.
5. A trusted literal passed to a sensitive operation produces no taint finding.
6. Overwriting a tainted variable with a trusted literal clears its explicit value-flow taint on that path.
7. Taint from either branch is retained at a merge and reaches a later sink.
8. Loop examples reach a stable result and account for zero iterations.
9. A tainted bound value with an untainted valid `sql_bind` template produces no query-text finding.
10. A tainted `sql_bind` template still produces a finding.
11. A tainted `shell` argument produces a finding; no actual command is executed.
12. Graph selection, source highlighting, state inspection, and analysis replay correspond to the current source snapshot.
13. Editing source marks old results as stale; reanalysis replaces them consistently.
14. Command-line and graphical runs produce equivalent findings on the same fixture set.
15. Exported reports include the source snapshot, version, findings, diagnostics, statistics, and analysis limitations.
16. Resource-limit or interrupted runs are labeled incomplete and are never presented as having no detected unsafe flows.
17. A fresh setup can install dependencies and reproduce the documented demonstration using the README.

Use wording such as “No unsafe flows detected by the supported analysis” for a completed run without findings. Do not label the program universally secure.

## 11. Testing and Evaluation

Create independently reviewed fixtures with expected findings and source locations. Cover direct flow, transitive flow, multiple sources, overwrites, branches, loops, trusted input, binding behavior, invalid programs, and documented analysis limitations.

Validate lexer and parser behavior, semantic rules, graph edges, taint transfers, merges, convergence, provenance, UI interactions, report exports, and command-line parity. Tests should assert behavior, not merely repeat implementation details.

For the labeled fixture set, report true positives, false positives, false negatives, and true negatives with an explicitly stated counting unit. Report precision and recall only when their denominators are nonzero. Keep syntax errors and incomplete runs separate from completed analysis results.

Measure analysis runtime, graph size, worklist updates, and replay size on documented inputs. Record machine details, analyzer version, and measurement procedure. A small educational test suite does not establish production security effectiveness.

## 12. Submission Deliverables

1. Working local application and command-line tool.
2. Source code for the lexer, parser, semantic checks, graph construction, analysis, and interface.
3. README with installation, execution, and demonstration instructions.
4. Language specification covering grammar, types, scope, built-ins, and errors.
5. Design documentation tracing source text to findings and visual explanations.
6. Test fixtures, automated tests, and reproducible evaluation results.
7. Exported example reports and demonstration screenshots or recording.
8. Assignment report covering the problem, core algorithms, design decisions, results, and limitations.

## 13. Proposed Delivery Stages

1. Approve product scope and resolve the planning inputs below.
2. Write and approve a deterministic implementation plan and language specification.
3. Implement and verify the compiler front end.
4. Implement graph construction and taint analysis with command-line fixtures.
5. Add explanations, report export, and the visual workspace.
6. Verify acceptance criteria and prepare the submission and demonstration.

These stages describe product milestones. They do not authorize implementation or replace the implementation plan.

## 14. Risks and Scope Controls

- **Excessive language scope:** Keep one top-level program and fixed built-ins for the first release.
- **UI work obscures fundamentals:** Make the command-line engine correct before building the animation.
- **Conservative false alarms:** Explain branch merging and path limitations explicitly.
- **Misleading graph routes:** Present provenance as possible value flow, not a proven attack execution.
- **Model-specific conclusions:** State that binding and sink behavior follow the documented educational model.
- **Large replay traces:** Define trace limits and show truncation separately from whether the underlying analysis completed.

## 15. Review and Planning Inputs

The selected project and creation of this PRD are authorized. The requirements above remain proposed until reviewed.

Before implementation, confirm:

- Acceptance of a custom language rather than analysis of an existing language.
- Acceptance of the proposed initial scope, built-ins, and explicit-flow limitation.
- Preferred or course-required implementation language, libraries, and restrictions on parser generators.
- Whether the course requires code generation in addition to compiler-front-end and analysis work.
- Submission deadline, team size, available development time, and required report format.
- Acceptance of a local desktop web interface and command-line tool.

No answers are assumed for these planning inputs. Resolve them before approving the implementation plan.

## 16. Technical Reference

[Clang Static Analyzer: Taint Analysis Configuration](https://clang.llvm.org/docs/analyzer/user-docs/TaintAnalysisConfiguration.html) provides a real-world reference for modeling sources, propagation, and sensitive arguments. FlowGuard will implement its own educational analysis; this reference is not a dependency or a claim of equivalent capability.
