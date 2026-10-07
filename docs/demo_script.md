# FlowGuard demonstration and rehearsal

Prepare with Node 26.5.0, npm 11.17.0, `npm ci`, `npm run build`, then `npm run preview`. Open http://127.0.0.1:4173 at a desktop viewport. This production preview uses only locally served assets. The first dependency/browser installation requires network access.

## Five-minute sequence

1. Show the empty editor. Explain: a compiler checks a program and transforms it; an analyzer follows possible input flow. Nothing runs until Run is selected.
2. Enter the program below and select Analyze.
3. Show tokens, AST, symbols and states in Inspection. Show the input node, query sink and connecting control-flow graph. Select `SQL_QUERY_TEXT · 2:1`; the matching source and explanation should appear. Select a bytecode row and show the source/graph link.
4. Reset replay, advance several updates, then View final analysis. Explain that replay shows solver updates, not a program execution. Reduced-motion disables autoplay, but manual updates work.
5. Supply `["Ada"]` in the input field and select Run. Show input and simulated query events, plus the final `name` value. Export JSON or Markdown. Explain that no database query is sent.
6. Replace the query call with `sql_bind("SELECT * FROM users WHERE name = ?", name);`. Show that Run is disabled until Analyze is repeated. Reanalyze: zero modeled explicit-flow findings. Run again: a simulated binding event retains template and typed value separately.
7. Enter `print(1 / 0);`, Analyze and Run. Show runtime-error without losing the completed static artifact. Then try `while(true){}` and Stop execution; retry reaches a fixed instruction/time limit. This demonstrates bounded execution.
8. Export a previous snapshot after an edit, showing the label and preserved analyzed source. Save source before reloading; reload begins empty because there is no autosave.

```fg
let name: string = input("Name");
sql_query("SELECT * FROM users WHERE name = " + name);
```

For a branch/loop graph, load `examples/branch-merge.fg` or `examples/arithmetic-loop.fg` through Examples. Exact supplied input values are listed in the example catalog/help.

## Questions both teammates should answer

- Why separate lexical analysis, parsing, semantic checking and lowering?
- Why does assignment overwrite taint, while a control-flow merge unions source sets?
- Why does a finite set of slots and sources allow worklist convergence?
- Why can an unreachable branch still produce a finding? What flows are outside the model?
- How do bytecode stack typing and definite initialization protect the VM?
- How are stale workers rejected, and how does Stop differ from cooperative core cancellation?
- Why is a bound value excluded from query-text taint, and why is that not a universal SQL security guarantee?

## Rehearsal record

Automated browser tests execute the unsafe-to-binding and failure/Stop sequence. They do not prove a human presentation rehearsal. Harsh and Jyot must each run this script and confirm they can explain the other teammate's modules before submission. No human rehearsal has been recorded yet. Exact faculty submission time and required demo computer remain unspecified; the report format was confirmed as Markdown.
