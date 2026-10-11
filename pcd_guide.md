# Principles of Compiler Design through FlowGuard

This guide assumes you know what a variable, condition, and loop are, but have not studied compiler internals in depth. Each concept explains what it means, how FlowGuard uses it, where the implementation lives, and what you can show faculty. The mapping reflects the source inspected on **11 October 2026**.

Use [demo_guide.md](demo_guide.md) to present the project and [architecture_guide.md](architecture_guide.md) for the complete implementation inventory.

## 1. What is a compiler, and where does FlowGuard fit?

A compiler translates a source program into a target representation. It normally recognizes the language, checks its meaning, builds an internal representation, and produces instructions for a target machine or runtime.

The target does not have to be CPU machine code. FlowGuard compiles its own small `.fg` language into **bytecode for its own virtual machine**.

FlowGuard also performs static analysis during compilation. It asks where input data could flow without executing the user's program. This demonstrates that a compiler's internal representations can support more than translation: they can support program reasoning and useful diagnostics.

```text
Source characters
    ↓ lexical analysis
Tokens
    ↓ syntax analysis
Abstract Syntax Tree
    ↓ semantic analysis
Symbols, scopes, resolved names, expression types
    ↓ lowering
Typed instructions and control-flow graph
    ↓ data-flow analysis
Possible input sources at each storage slot and instruction
    ↓ findings and supporting explanations
Possible unsafe input-flow reports
    ↓ code generation and verification
Verified bytecode
    ↓ explicit Run with concrete inputs
Virtual-machine execution and simulated events
```

The entry point coordinating compilation is **`analyzeSource` in [analyze.ts](packages/core/src/analyze.ts)**. The execution entry point is **`runBytecode` in [vm.ts](packages/core/src/vm.ts)**. These are separate operations.

## 2. Quick concept-to-file map

| PCD concept | Main implementation | What to inspect |
|---|---|---|
| Lexical analysis / scanner | [lexer.ts](packages/core/src/lexer.ts): `lex` | Character scanning, keyword/operator tables, tokens and lexical errors. |
| Syntax analysis / parsing | [parser.ts](packages/core/src/parser.ts): `Parser`, `parse` | Statement grammar, precedence-climbing expressions, syntax errors. |
| Abstract Syntax Tree | [model.ts](packages/core/src/model.ts), [ast.ts](packages/core/src/ast.ts), `parser.ts` | Node kinds, child relationships, spans and traversal. |
| Semantic analysis | [semantic.ts](packages/core/src/semantic.ts): `SemanticChecker`, `checkSemantics` | Meaning checks after parsing. |
| Symbol table and lexical scope | `semantic.ts` | Scope-frame maps, outward lookup, symbols, resolved uses. |
| Static type checking | `semantic.ts` | Exact operand/assignment/condition/built-in types. |
| Intermediate representation (IR) | [lower.ts](packages/core/src/lower.ts): `Lowerer`, `lowerProgram` | Typed slots, temporaries, instruction emission and labels. |
| Control-flow graph (CFG) | [graph.ts](packages/core/src/graph.ts) with `lower.ts` | Branch/loop edges, predecessors/successors, graph validation. |
| Short-circuit evaluation | `lower.ts`, [codegen.ts](packages/core/src/codegen.ts), `vm.ts` | Branches that skip unnecessary right operands. |
| Data-flow / abstract interpretation | [taint.ts](packages/core/src/taint.ts): `solveTaint` | Abstract source sets, transfer rules, joins and worklist. |
| Fixed-point computation | `taint.ts`, [verify.ts](packages/core/src/verify.ts) | Iteration until analysis information stops changing. |
| May-analysis | `taint.ts` | Union of possible input-source contributions. |
| Must-analysis / definite initialization | `verify.ts` | Intersection of definitely initialized slots. |
| Code generation and jump patching | `codegen.ts`: `generateBytecode` | Stack-machine emission, constants, IR-to-PC starts and target patching. |
| Bytecode verification | `verify.ts`: `verifyBytecode` | Stack typing, references, joins, definite initialization. |
| Runtime environment / interpreter | `vm.ts`: `runBytecode` | PC, storage slots, operand stack, instructions and runtime errors. |
| Source mapping and diagnostics | [source.ts](packages/core/src/source.ts), [diagnostics.ts](packages/core/src/diagnostics.ts), all compiler passes | Precise source locations carried through stages. |
| Findings and explanations | [findings.ts](packages/core/src/findings.ts), [provenance.ts](packages/core/src/provenance.ts) | Project-specific use of final analysis facts. |
| Analysis history | [replay.ts](packages/core/src/replay.ts) | Solver-update recording/reconstruction, distinct from runtime. |

The UI views these results. `apps/web/src/editor/language.ts` colors code in Monaco; the actual compiler lexer is `packages/core/src/lexer.ts`.

## 3. Lexical analysis: characters become tokens

Consider:

```fg
let total: int = 2 + 3 * 4;
print(total);
```

A **token** is a meaningful unit recognized by the language. A **lexeme** is the actual source text belonging to that unit. For example, `total` is a lexeme whose token kind is `IDENTIFIER`.

The first statement becomes:

```text
LET IDENTIFIER COLON TYPE_INT ASSIGN
INTEGER PLUS INTEGER STAR INTEGER SEMICOLON
```

The lexer also retains each lexeme and its source span. The integer token for `2` includes the decoded typed value `{ type: "int", value: 2 }`.

**Implementation:** `lex` in `lexer.ts` scans with a character cursor. Identifier characters and keyword lookup distinguish names from reserved words. String literals use explicit escape decoding. Two-character operators such as `<=` are checked before single-character operators. Comments and whitespace are skipped; EOF terminates the token stream.

This is a handwritten scanner. It does not call Lex/Flex or generate a DFA table. The scanner demonstrates token-recognition ideas through direct code.

**Demonstrate:** Analyze the program and open **Inspection → tokens**. For a lexical error, try an unfinished string such as `print("hello);`; the lexer reports an unterminated string before parsing can complete.

**Remember:** lexical analysis recognizes pieces. It does not determine whether an integer can be assigned to a string or whether a variable exists.

## 4. Syntax analysis: tokens become a structured program

Syntax is the arrangement of tokens according to grammar rules. An illustrative declaration grammar is:

```text
declaration → let identifier : type = expression ;
```

The parser therefore requires an initializer and a final semicolon. It recognizes a declaration as one structured statement, rather than just a list of tokens.

FlowGuard uses a **handwritten recursive-descent parser** for statements: methods recognize blocks, declarations, assignments, conditions, loops, and effects. Expressions use **precedence climbing**.

For:

```text
2 + 3 * 4
```

the expression tree is conceptually:

```text
       +
      / \
     2   *
        / \
       3   4
```

The multiplication is grouped before addition because `*` has higher precedence. The parser does not evaluate the arithmetic; it records its structure.

**Associativity** resolves operators with equal precedence. `10 - 3 - 2` groups as `(10 - 3) - 2`. In `parser.ts`, `expression(min)` parses the right operand with `rank + 1`, producing left associativity.

**Implementation:** `Parser.statement`, `block`, `expression`, `unary`, and `primary`, exposed through `parse` in `parser.ts`. It does not use Yacc/Bison or an LR parsing table.

**Demonstrate:** open **Inspection → ast** after Analyze. Remove the first statement's semicolon and reanalyze: `PARSE_EXPECTED` identifies a syntax error. The tokens remain available, but there is no completed AST or runnable bytecode.

## 5. Abstract Syntax Tree: keep meaning, discard unnecessary punctuation

An **AST** represents the essential structure of the source. A declaration contains its name, declared type, and initializer. A binary expression contains an operator and two operands. A loop contains its condition and body.

Punctuation such as semicolons does not need to become a separate tree node. Its purpose was to let the parser recognize boundaries.

In FlowGuard, nodes include `Program`, `Declaration`, `Assignment`, `Block`, `If`, `While`, `EffectCall`, `Literal`, `Variable`, `Unary`, `Binary`, and `InputCall`.

**Implementation:** node definitions are in `model.ts`; construction is in `parser.ts`; `children` and iterative `preorder` traversal are in `ast.ts`. The parser assigns deterministic `ast-N` IDs after the full tree is built. Nodes retain source spans for later diagnostics and selections.

The AST explains source structure. The CFG later explains possible execution order. These representations answer different questions.

## 6. Semantic analysis: valid grammar must also make sense

This statement follows the declaration grammar:

```fg
let age: int = "hello";
```

Its meaning is invalid because the initializer is text while the variable is integer. Semantic analysis detects this after parsing.

Other examples:

```fg
print(missing);
```

The variable has not been declared.

```fg
if (1) { print("yes"); }
```

The condition is integer, but FlowGuard requires a boolean.

**Implementation:** `SemanticChecker` in `semantic.ts` creates `expressionTypes`, `resolvedUses`, symbols/scopes, input sources, and diagnostics. Expression checking uses an explicit postorder stack so operands are checked before their enclosing expression.

Type rules include:

| Operation | Requirement / result |
|---|---|
| Integer arithmetic | int operands → int result. |
| String `+` | string/string → string result. |
| Relational comparison | int/int → bool result. |
| Equality | Matching scalar types → bool result. |
| `&&`, `||`, `!` | Boolean operands/result. |
| Assignment | RHS type exactly matches variable type. |
| `input(prompt)` | String prompt → string value. |
| `sql_query`, `shell` | One string argument. |
| `sql_bind` | String template plus scalar bound value. |

No automatic type conversion is performed. FlowGuard does not turn `"12"` into integer 12 automatically.

**Demonstrate:** Analyze the invalid `age` declaration. Tokens and AST exist, while `SEM_TYPE` prevents lowering and final bytecode publication.

## 7. Symbol tables and lexical scope: what does a name refer to?

A **symbol table** stores declared names and information about them: type, declaration location, scope, and storage identity. The compiler uses it to connect a name such as `total` to a specific declaration.

**Scope** determines where a declaration can be used:

```fg
let outer: int = 1;
{
  let inner: int = 2;
  print(outer + inner);
}
print(outer);
```

`inner` is visible inside its block. `outer` is visible both there and afterward. Adding `print(inner);` after the block produces an undeclared-name error.

**Implementation:** `semantic.ts` maintains a stack of scope frames, each with a name-to-symbol Map. `lookup` searches outward. `scope` pushes/pops a frame. Each symbol has `sym-N`, `slot-N`, type, scope ID, span, and top-level metadata.

The initializer is resolved before the new declaration is inserted. Consequently, `let n: int = n;` cannot initialize itself. Same-scope duplicates and shadowing a visible name are rejected. Sibling blocks can reuse a name because their scopes are separate.

**Demonstrate:** open **Inspection → symbols** and connect a symbol's `slotId` to its entry in **states**. At runtime, final top-level values exclude block locals and temporary storage.

## 8. Intermediate representation: simplify the source for later passes

Source trees contain high-level expressions. Later analysis and execution become easier if these are rewritten into a small set of operations. This process is **lowering**; its output is an **intermediate representation**, or IR.

For the expression `2 + 3 * 4`, the lowered operations are conceptually:

```text
t1 = constant 2
t2 = constant 3
t3 = constant 4
t4 = t2 * t3
t5 = t1 + t4
total = copy t5
print total
halt
```

These temporary labels illustrate the operations; inspect the actual `slot-N` IDs in the program's artifacts. Temporary slots retain intermediate values that have no name in the source.

This resembles **three-address code**: a binary operation has a destination and two operands. FlowGuard's typed IR also includes constants, input/effect instructions, branches, jumps, and HALT.

**Implementation:** `Lowerer` in `lower.ts` allocates typed slots and emits instructions. `LoweredInstruction`/`LoweredProgram` definitions are in `model.ts` and `contracts.ts`. `graph.ts` validates references, operand types, spans, and edges.

The project does not use SSA form or phi nodes. It uses mutable typed slots and merges data-flow states at CFG joins.

## 9. Control-flow graphs: where can execution go next?

A **CFG** is a directed graph describing possible execution order. In FlowGuard, each node is one lowered instruction.

- Straight-line instructions have a `next` edge.
- Conditions produce `true` and `false` edges.
- Jumps redirect execution.
- Loops have an explicit `loop-back` edge and a false exit.

A loop is conceptually:

```text
initialize → test ── false ──→ after loop
               │
              true
               ↓
              body
               │
               └── loop-back → test
```

**Implementation:** `lower.ts` emits labels, branch targets, and jumps. `deriveEdges` in `graph.ts` builds edges; `adjacency` builds predecessor/successor maps. A predecessor can execute before a node; a successor can execute next.

React Flow and Dagre display/layout this already constructed graph. They do not discover branches or loops.

**Demonstrate:** load **Arithmetic loop**, Analyze, and point out test/body/backedge/exit. Run with `[]`: the program prints integer 3. Static analysis represents the loop; runtime actually repeats its body.

## 10. Short-circuit evaluation: some expressions skip work

For `A && B`, the runtime need not evaluate B if A is false. For `A || B`, it need not evaluate B if A is true.

```fg
let answer: bool = false && (input("Skipped") == "yes");
print(answer);
```

This compiles successfully and runs with `[]`, printing false without consuming input.

**Implementation:** `lower.ts` turns these operators into branches and copies. `codegen.ts` translates those into conditional/unconditional jumps; `vm.ts` follows the selected path. There is no eager AND/OR opcode.

The static analyzer keeps structural alternatives, including the right-operand path. That does not force runtime to execute it. This is another example of static possibility differing from concrete execution.

## 11. Data-flow analysis and abstract interpretation

A compiler can reason about properties of values without storing their actual runtime contents. This is **static data-flow analysis**. **Abstract interpretation** means using a simplified representation of values to compute such properties.

FlowGuard's concrete runtime value might be `"Ada"`. During taint analysis, the useful question is where that value could have originated, not its exact spelling. The abstract value is therefore a set of input-source IDs.

```fg
let name: string = input("Name");
let query: string = "SELECT " + name;
sql_query(query);
```

Conceptually:

```text
fixed text → {}
input occurrence → {src-0}
name → {src-0}
query → {} union {src-0} = {src-0}
```

The empty set means no tracked explicit input contribution. It does not certify arbitrary safety.

**Implementation:** `taint.ts` keeps incoming/outgoing states per IR node. Each reached state has a sorted source-index set for each slot. `unionSources` combines source sets; `solveTaint` applies transfer functions and schedules affected nodes.

The **transfer function** describes how one instruction changes the abstract state:

| Instruction | Rule |
|---|---|
| Constant | Destination becomes the empty source set. |
| Input | Destination becomes this input occurrence's singleton set. |
| Copy/unary | Destination receives operand sources. |
| Binary | Destination receives the union of both operand source sets. |
| Other instructions | Preserve the tracked slot state. |

An assignment **kills** the destination's old contribution and replaces it with the RHS contribution. For example:

```fg
let text: string = input("Value");
text = "fixed";
shell(text);
```

At the shell operation, `text` has no tracked input contribution, so there is no modeled command-text finding. Input was read, but it no longer contributes to that argument.

At a branch merge, information from alternatives is combined. If one path yields `{src-0}` and another `{}`, the merged set is `{src-0}`: input **may** reach this point.

`findings.ts` then checks the converged sensitive argument. `provenance.ts` follows supporting dependencies backward to explain the finding. The CFG arrows still mean control flow; supporting source facts explain data dependencies.

## 12. Worklists, lattices, and fixed points

One forward pass is insufficient for loops because information can return along a backedge. A **worklist** remembers instructions whose information needs updating.

FlowGuard's solver works like this:

```text
schedule entry
while work remains:
    pop one node
    join the outputs of its reached predecessors
    apply this node's transfer rule
    if its output/reachability changed:
        schedule affected successors
```

It uses FIFO order and avoids duplicate queued nodes. Once no output changes and no work remains, the solution has reached a **fixed point**: another application of the rules would not change it.

The mathematical structure behind this is a finite **lattice**. For one input source, a slot can have `{}` or `{src-0}`. With two input sources it can have `{}`, `{src-0}`, `{src-1}`, or `{src-0, src-1}`. Sets are ordered by inclusion, and union is their join. The whole analysis state combines those slot values and reachability.

The input-source set is finite and transfer functions are monotone with respect to this ordering. Propagation from the initially unreached states reaches a least fixed point. A constant/overwrite can clear the destination on a path while still being a monotone transfer function: it consistently replaces that destination instead of depending negatively on incoming information.

“Monotone” does not mean every destination remains tainted forever as execution moves forward. It describes how the analysis function behaves when its incoming abstract information grows.

**Implementation:** `solveTaint` in `taint.ts`. Runtime/input/state/work limits in `limits.ts` additionally bound accepted computation. A budget failure produces an incomplete outcome rather than a successful partial verdict.

**Demonstrate:** show **Loop input flow** and replay updates. A repeated source read has one static `src-N` identity but can produce multiple runtime events. Solver visits are not runtime loop iterations.

## 13. May-analysis versus must-analysis

These are two useful kinds of data-flow reasoning, both implemented here.

| Analysis | Question | Merge operator | Implementation |
|---|---|---|---|
| Taint may-analysis | Could this slot contain data from a given input source on any represented path? | Union | `taint.ts` |
| Definite-initialization must-analysis | Has this slot been initialized on every represented incoming path? | Intersection | `verify.ts` |

For taint, one input-containing predecessor is enough to retain the possibility. For initialization, every predecessor must initialize the slot before a LOAD is accepted.

Suppose one predecessor has initialized `{slot-0, slot-1}` and another only `{slot-0}`. Their intersection is `{slot-0}`. Loading slot-1 is not definitely justified.

The bytecode verifier uses bitsets, starts nonentry reached nodes with the full slot universe, includes an external empty initialization set at entry, and iterates downward. STORE adds initialization. It checks LOAD only after this **greatest fixed point** converges, avoiding premature conclusions around loops.

This is one of the strongest PCD connections to explain in a viva: the same general graph-analysis idea supports two different questions, with different domains, merge rules, and initialization choices.

## 14. Code generation: translate IR into a stack machine

A **stack machine** performs computations by pushing operands onto a stack and applying instructions that pop operands and push results.

For an integer addition stored in a destination, FlowGuard emits:

```text
LOAD left-slot
LOAD right-slot
ADD_INT
STORE destination-slot
```

The stack evolves as follows:

```text
[] → [left] → [left, right] → [sum] → []
```

**Implementation:** `generateBytecode` in `codegen.ts`. It chooses opcodes from typed IR, deduplicates typed constants, records source maps, and leaves the stack empty at IR boundaries. String addition chooses `CONCAT_STRING`.

Branches need target addresses. Generation first records where each IR node begins in bytecode and emits jumps with placeholder targets. A later pass patches them to the recorded PCs. This implements forward-target resolution rather than guessing addresses while emitting.

**PC**, or program counter, means the bytecode instruction index. Every PC maps back to the original AST/IR/source span.

**Demonstrate:** select a `DIV_INT`, `CONCAT_STRING`, or jump in **Verified bytecode** and show the corresponding graph/source highlight. `disassembleBytecode` produces readable rows; it is not generating native assembly.

## 15. Verification: is the generated instruction program internally valid?

Source type checking and bytecode verification happen at different abstraction levels.

Semantic analysis checks source operations and names. Verification checks the actual instruction artifact: valid operands/references, consistent stack types, matching join stacks, and definitely initialized storage.

For example, `ADD_INT` must receive two integers. A jump target must exist. Two paths joining at one PC must agree on stack height and element types. HALT must have an empty stack.

**Implementation:** `verifyBytecode` in `verify.ts`, using schemas from `contracts.ts`. Its first data-flow pass propagates stack types and maximum stack depth; its second verifies definite initialization as described above.

The coordinator publishes runnable bytecode only after verification. The VM verifies again when execution is requested; it does not trust a UI button's enabled state.

Verification does not prove termination or rule out division by zero. It establishes specific structural/type/initialization properties.

## 16. Runtime environment: executing bytecode

A **virtual machine** is a software execution engine for an instruction language. FlowGuard's VM holds:

- A PC identifying the next instruction.
- Typed slots storing user variables and temporary values.
- An operand stack for calculations.
- Supplied input values and a consumed-input cursor.
- Runtime events, diagnostics, and resource accounting.

**Implementation:** the opcode dispatch loop in `vm.ts`. Integer operations use BigInt intermediates to check signed 32-bit overflow accurately; public integer values remain int32 numbers. Missing input, zero divisors, and overflow are runtime failures.

Consider:

```fg
let result: int = 12 / 0;
print(result);
```

The grammar and types are valid, and the generated bytecode can verify. During Run, division fails before storing `result`, so there is no initialized final value and no print event.

Execution has instruction/time/storage/output limits. `while (true) {}` can compile and verify but cannot run indefinitely in this VM. SQL/shell instructions record simulations; they do not perform external effects.

## 17. Error classes and source mapping

| Kind of problem | Example | Detecting module / result |
|---|---|---|
| Lexical | Unfinished string | `lexer.ts`; lexical code, invalid source. |
| Syntax | Missing semicolon | `parser.ts`; `PARSE_EXPECTED`, invalid source. |
| Semantic | Text initializer for int | `semantic.ts`; `SEM_TYPE`, invalid source. |
| Analysis finding | Input contributes to query text | `findings.ts`; completed compilation with a finding. |
| Bytecode consistency | Invalid LOAD/jump/stack | `verify.ts`; `BYTECODE_INVALID`. |
| Runtime | Division by zero | `vm.ts`; `RUNTIME_DIV_ZERO`, runtime error. |
| Resource exhaustion | Too many steps / deadline | `limits.ts` and relevant pass; incomplete limit. |

A security finding is not a syntax/type error. A program with a finding can still compile and run. Conversely, zero findings does not imply successful runtime execution.

Spans are created by `source.ts` and carried through tokens, AST, IR, bytecode source maps, diagnostics, and events. The UI converts spans to Monaco ranges through `apps/web/src/editor/text.ts`. This is why selecting an artifact can identify the corresponding source instead of showing an isolated compiler result.

## 18. Scope of the analysis and concepts not implemented

FlowGuard tracks **explicit data flow**. If input influences a value through assignment or an operator, its contribution propagates. It does not add taint merely because input controls a branch:

```fg
let choice: string = input("Choice");
let text: string = "A";
if (choice == "yes") { text = "B"; }
shell(text);
```

There is no modeled command-text finding here. The branch condition depends on input, but both possible text values are constants. Tracking that influence would require **implicit/control-flow taint**, which the project does not implement.

Both CFG alternatives are retained even for `if (false)`, so infeasible paths can create false alarms. The project does not perform condition solving, constant-folding/path-pruning optimization, general SQL validation, or whole-program analysis of external libraries.

It also does not implement native code generation, register allocation, SSA/phi nodes, user-defined functions, arrays/objects, or a general-purpose Python/C/Java frontend. These are possible compiler topics to study later, not claims about this implementation. Constant-pool deduplication is implemented, but it is not an optimizing compiler pipeline.

## 19. How to study and explain the code

Use one small program and follow it across representations:

1. **Lexer:** explain token versus lexeme and point to `lex`.
2. **Parser:** explain grammar, precedence, AST and point to `Parser.expression`/`statement`.
3. **Semantic checker:** explain symbol resolution/type rules and point to `lookup`, `expression`, and `statement` in `SemanticChecker`.
4. **Lowering/CFG:** explain temporaries, branches, joins, backedges and point to `Lowerer` plus `deriveEdges`.
5. **Taint solver:** explain source sets, transfer, union, worklist, fixed point and point to `solveTaint`.
6. **Code generator:** explain LOAD/operation/STORE and jump patching in `generateBytecode`.
7. **Verifier:** explain stack typing and intersection-based definite initialization in `verifyBytecode`.
8. **VM:** explain concrete PC execution and runtime failures in `runBytecode`.

For proof by example, use the source files in `packages/core/test/`: `lexer.test.ts`, `parser.test.ts`, `semantic.test.ts`, `lower.test.ts`, `taint.test.ts`, `bytecode.test.ts`, and `vm.test.ts`. Test helpers assemble pipelines; they are not the actual compiler implementation.

### Short viva answers to practice

| Question | Answer |
|---|---|
| What is syntax analysis in your project? | The parser checks token arrangement and builds an AST; `packages/core/src/parser.ts`. |
| How is semantic analysis different? | It checks names, scopes and types after parsing; `packages/core/src/semantic.ts`. |
| Why use an IR? | A small typed instruction set simplifies graph analysis and bytecode generation. |
| Why are temporaries needed? | They store intermediate expression values that source variables do not name. |
| What is your analysis domain? | A finite set of possible input-source identities for each typed slot, plus reachability. |
| Why union taint at a merge? | We ask whether input may arrive from any represented predecessor. |
| Why intersection for initialization? | We require storage to be initialized on every represented predecessor. |
| Why a worklist? | Loops and changed predecessor facts require revisiting affected nodes. |
| Is replay execution? | No; replay reconstructs analysis updates. Run executes concrete bytecode. |
| Why can valid bytecode fail? | Type/structure checks do not establish runtime arithmetic safety or termination. |
| What connects everything to source? | Exact spans and source maps carried through the pipeline. |
| What is the project's target machine? | Our own typed stack-bytecode VM, not the native CPU instruction set. |

The strongest demonstration is to explain one variable across the source, symbol table, IR slot, source set, bytecode instructions, and final runtime value. That shows you understand the full compiler pipeline rather than only the visible interface.
