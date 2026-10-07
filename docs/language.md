# FlowGuard Language — Version 1

Phase 1 implements tokenization, parsing, scope/type checking, and typed control-flow lowering. Phase 2 adds explicit may-taint, explanations/replay, reports and integration. Phase 3 completes public analysis, typed bytecode generation/verification and bounded VM execution. Source is never executed by the implemented static APIs.

## Source and lexical rules

Files use `.fg` and UTF-8. A leading BOM is ignored by the lexer but retained in original source offsets, snapshots, and downloads. CRLF, CR, and LF remain unchanged; spans use end-exclusive UTF-16 offsets and one-based line/column coordinates. Unicode is allowed in strings/comments. Identifiers use `[A-Za-z_][A-Za-z0-9_]*`.

Reserved words: `let string int bool if else while true false input print sql_query sql_bind shell`. Comments are `//` through the line ending or nonnested `/* ... */`. Unterminated block comments are errors. Whitespace is ASCII space, tab, CR/LF, vertical tab, or form feed.

Strings use double quotes. Supported escapes are `\"`, `\\`, `\n`, `\r`, and `\t`. Unknown escapes and raw line breaks are errors. Integers are decimal literals from 0 through 2147483647; use `-2147483647 - 1` for the minimum signed integer. Runtime overflow/division rules are specified below but execution is not implemented in Phase 1.

## Grammar

```ebnf
program       = { statement }, EOF ;
statement     = declaration | assignment | effect | block | conditional | loop ;
declaration   = "let", identifier, ":", type, "=", expression, ";" ;
assignment    = identifier, "=", expression, ";" ;
type          = "string" | "int" | "bool" ;
block         = "{", { statement }, "}" ;
conditional   = "if", "(", expression, ")", block, [ "else", block ] ;
loop          = "while", "(", expression, ")", block ;
effect        = effectName, "(", [ expression, { ",", expression } ], ")", ";" ;
effectName    = "print" | "sql_query" | "sql_bind" | "shell" ;
expression    = or ;
or            = and, { "||", and } ;
and           = equality, { "&&", equality } ;
equality      = relational, { ("==" | "!="), relational } ;
relational    = additive, { ("<" | "<=" | ">" | ">="), additive } ;
additive      = product, { ("+" | "-"), product } ;
product       = unary, { ("*" | "/" | "%"), unary } ;
unary         = ("!" | "-"), unary | primary ;
primary       = integer | string | "true" | "false" | identifier
              | "(", expression, ")" | "input", "(", expression, ")" ;
```

Binary operators associate left; unary operators associate right. Fixed effect argument counts are checked semantically. No arbitrary function calls, empty statements, break/continue, else-if shorthand, arrays, objects, or user-defined functions exist. Empty/comment-only programs are valid and lower to one halt instruction. The UI still disables Analyze for whitespace-only source.

## Scope and exact types

Declarations require initializers. Resolve the initializer before bringing its declaration into scope. Referencing an undeclared name, a duplicate declaration in the same scope, or shadowing any visible name is an error. Sibling blocks may reuse a name with separate symbol/slot IDs. Block declarations cannot be used outside the block. While-body declarations are initialized on each runtime iteration under the planned VM behavior.

Assignment requires an existing visible name and an exactly matching scalar type. Conditions and `&&`, `||`, `!` require bool. Unary `-`, arithmetic other than `+`, and relational comparisons require int. `+` accepts int/int or string/string. Equality compares matching scalar types. There are no coercions. `1 < 2 < 3` is parsed left-associatively, then rejected because the second comparison receives a bool.

```fg
let name: string = input("Name");
let count: int = 0;
while (count < 3) {
  print(name);
  count = count + 1;
}
sql_bind("SELECT * FROM users WHERE name = ?", name);
```

Invalid examples:

```fg
let x: int;                 // Missing initializer: PARSE_EXPECTED
let y: int = y;             // Not visible in its initializer: SEM_UNDECLARED
let n: int = "1";           // No automatic conversion: SEM_TYPE
```

## Built-ins and placeholder checking

`input(prompt)` accepts one string expression and returns string. Each occurrence has one static source ID, sorted by original start offset, including nested inputs. `print(value)` accepts one scalar. `sql_query(query)` and `shell(command)` accept one string. `sql_bind(template, value)` accepts one string template and one scalar bound value. Effects cannot be used as value expressions.

A directly literal sql_bind template must contain exactly one decoded `?` character, or `SEM_TEMPLATE_PLACEHOLDERS` blocks lowering. Counting characters does not parse SQL. Every nonliteral template, including a variable initialized with a literal or string concatenation, receives nonblocking `TEMPLATE_UNVERIFIED`; lowering continues when there are no blocking diagnostics. This notice does not assert a security finding or valid SQL.

```fg
let template: string = "SELECT * FROM t WHERE id = ?";
sql_bind(template, 1); // Notice: template format remains unverified.
```

Phase 2 taint analysis treats template/query/command argument zero as the sensitive text; the bound value alone does not produce a query-text finding. The front-end APIs alone do not claim a taint verdict, and incomplete coordinator results withhold final public findings.

## Evaluation and lowering

Ordinary operands and effect arguments lower left-to-right. User slots allocate by symbol order; temporary slots allocate during lowering. Every instruction references its AST owner, exact span, and visible symbols. Instructions are constants, copies, unary/binary operations, inputs, effects, branches, jumps, and one final halt.

`&&` and `||` become conditional paths: one path evaluates the right operand and copies its bool; the other writes the fixed bool result. Both paths assign the shared result slot before merging. Structural alternatives remain in the graph even when the condition is a literal. No constant-folding/path-removal optimization is applied.

If/else branches join at the following instruction; missing else is an empty false path. A while graph has a test, true body edge, explicit jump back to the test, and false exit. Loop input occurrences reuse their static source IDs. CFG edge metadata distinguishes next/true/false/jump/loop-back, independent of future visual layout.

Runtime semantics: signed int32 arithmetic is widened exactly before range checks; division truncates toward zero; remainder follows the dividend; overflow and division/remainder by zero fail. Short-circuit avoids unnecessary right-operand evaluation. These behaviors are implemented and covered by VM tests.

## Errors and limits

Lexer/parser stop at their first source error and do not publish a partial AST. Semantic checking retains up to 100 diagnostics, then adds `TOO_MANY_DIAGNOSTICS` and stops. Lowering rejects any semantic model containing a blocking diagnostic. Schema validation preserves invalid-arity effect ASTs so semantic errors can be inspected. AST validation/traversal is iterative for long, flat expressions.

Hard caps: source 262144 UTF-8 bytes; 65536 tokens including EOF; 20000 total AST nodes; 128 syntax nesting; 4000 total user/temporary slots; 2000 CFG instructions; 256 static input sources. The shared guard enforces cancellation/deadline checkpoints and a 10-second compilation deadline. Resource failures are typed limits, not successful partial compilation. All release limits are fixed.

## Public Phase 1 APIs

Use exports from `@flowguard/core`: `lex(snapshot, guard)`, `parse(tokens, snapshot, guard)`, `checkSemantics(program, snapshot, guard)`, and `lowerProgram(program, semantic, guard)`. Semantics returns diagnostics for review; only a model without blocking diagnostics may be lowered. `deriveEdges`, `adjacency`, and `validateLoweredProgram` expose graph structure/validation. Snapshot hashing and file I/O belong to browser/CLI adapters; core has no browser or Node dependencies.

A completed front-end pipeline is not a completed Analyze result. Do not manufacture taint findings, verified bytecode, or runtime outcomes from these APIs.

## Phase 2 static APIs

`solveTaint(lowered, guard, optionalRecorder)` produces final per-node in/out explicit may-taint states. `collectFindings(lowered, states, semantic)` checks converged sensitive argument zero; `buildProvenance(lowered, states, findings, guard)` fills bounded explanation references/completeness and returns dependency facts. `ReplayRecorder`, `applyReplayEvent` and `reconstructReplay` record/reconstruct analysis updates; replay is separate from VM execution.

Assignments replace a destination's prior source set, input introduces its syntactic singleton, unary/copy propagate sets, binary unions, and joins union reached structural predecessors. Condition taint is not propagated as implicit control flow. Constant conditions and short circuits still retain structural alternatives, so possible-flow findings can include infeasible paths. No finding is proof of an attack or universal safety guarantee.

`analyzeSource` coordinates all compiler/static stages through codegen and verification. Final findings, bytecode and disassembly publish only on completed analysis; invalid/incomplete outcomes retain safe partial artifacts. `buildReport`/`serializeReport` validate snapshot/version/completion identity and enforce output caps. See [architecture](architecture.md) and [testing](testing.md).

## Phase 3 APIs and execution

`generateBytecode(lowered,snapshot,guard)`, `verifyBytecode(artifact,guard)` and `disassembleBytecode(artifact)` expose typed code generation, verification and inspection. `runBytecode(request,hooks)` reverifies its bounded execution envelope and runs explicit supplied inputs; no source evaluation or external effects occur. Missing inputs, division/remainder zero and int32 overflow are runtime errors. Budget exhaustion is incomplete-limit. Prior events remain in core failure results. See the fixed limits in `DEFAULT_LIMITS` and the runtime fixture manifest.

Bytecode includes approved topLevelSymbolIds from final HALT visibility. Runtime finalTopLevelValues reports initialized top-level symbols in symbol order, including core-reported runtime failures, limits and cooperative cancellation. Locals, temporaries and unreached declarations are omitted; invalid/unverified requests expose no values. Forcibly terminated browser workers cannot recover their local values/events.
