# FlowGuard bytecode — version 1

FlowGuard compiles its typed instruction graph to a typed stack machine. The target is implemented by the project, so the compiler, verifier and VM can all be inspected. It is an educational target with simulated effects.

## Artifact and generation

The artifact carries version, analyzed snapshot identity, typed constants, typed slots, numerically ordered input-source IDs, instructions, one source mapping per program counter (PC), and ordered `topLevelSymbolIds`. The last field identifies user variables visible at final HALT; block locals and temporary slots are excluded.

Each IR instruction emits stack operations with an empty stack at its boundary. Constants deduplicate by type and value in first-use order. Generation first records each IR node's starting PC, then patches branch targets to these starts. Every PC links back to an IR node, AST node and exact source span. Short circuit becomes branches and copies; there is no eager AND/OR opcode.

## Instructions and stack effects

Stack notation lists consumed values in push order; the rightmost value is popped first. `T` means a matching scalar type, and `[]` means no stack value.

- `PUSH_CONST constantIndex`: `[] → [T]`, pushes a typed constant.
- `LOAD slotIndex`: `[] → [T]`, reads an initialized slot.
- `STORE slotIndex`: `[T] → []`, stores exactly the slot's declared type.
- `NEG_INT`: `[int] → [int]`, checked negation.
- `NOT_BOOL`: `[bool] → [bool]`, boolean negation.
- `ADD_INT`, `SUB_INT`, `MUL_INT`, `DIV_INT`, `MOD_INT`: `[int, int] → [int]`, left operand followed by right operand.
- `CONCAT_STRING`: `[string, string] → [string]`.
- `LT_INT`, `LE_INT`, `GT_INT`, `GE_INT`: `[int, int] → [bool]`.
- `EQ`, `NE`: `[T, T] → [bool]`, exact matching scalar types.
- `JUMP targetPc`: `[] → []`, unconditional jump, with no fall-through.
- `JUMP_IF_FALSE targetPc`: `[bool] → []`, jumps on false, otherwise falls through.
- `INPUT sourceIndex`: `[string prompt] → [string value]`, consumes the next supplied input and retains its static source identity in the input event.
- `PRINT`: `[T] → []`, retains a typed print event.
- `SQL_QUERY`: `[string] → []`, retains a simulated query event.
- `SQL_BIND`: `[string template, T value] → []`, retains a simulated binding event.
- `SHELL`: `[string] → []`, retains a simulated command event.
- `HALT`: `[] → []`, the only successful termination.

Only PUSH_CONST, LOAD, STORE, JUMP, JUMP_IF_FALSE and INPUT take one unsigned integer operand. All other opcodes take none. Branches may occur within compiler-generated sequences, but stack types must agree at every reachable join.

## Verification

Before execution, validate the strict versioned artifact, operands, references, source mappings and top-level user-symbol metadata. Propagate stack types from an empty entry stack; reject underflow, type mismatch, invalid targets, unequal join stacks and stack depth above 1,024.

Definite initialization is a separate greatest-fixed-point pass. The entry has an external empty initialized set. Other reached nodes start with the full slot universe. Incoming sets intersect predecessor outputs; STORE adds its slot. Check LOAD only after convergence, avoiding premature approval or rejection on loops and forward predecessors. Each pass has a 200,000-visit cap and shares the compilation deadline. The VM verifies again rather than trusting a UI readiness flag.

## Runtime and failures

The VM uses BigInt internally to check signed 32-bit arithmetic exactly. Division truncates toward zero, remainder follows the dividend, and overflow or a zero divisor returns runtime-error. String operations keep exact text. Inputs are consumed in runtime encounter order, so skipped short-circuit operands consume none.

Fixed execution limits include 100,000 instructions, one second, 1,000 events, 1 MiB event payload, 64 KiB per string and 4 MiB retained slot/stack string bytes. See the PRD for every cap. Core-reported failure retains prior events and initialized top-level values. Forced browser worker termination cannot recover worker-local events or values. SQL and shell opcodes never contact a database or start a process.

Inspect actual disassembly and events in [the sample reports](evidence/unsafe-query-report.md). JSON contains the complete bytecode artifact; report export is not executable bytecode import.
