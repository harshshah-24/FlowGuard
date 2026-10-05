# Phase 1 — Front End and Control-Flow Lowering

**Suggested window:** 5–6 October 2026

**State:** Published on main at `ed9f952`; remote CI passed. User approved Phase 1 implementation and the exact DOMPurify 3.4.16 override on 5 October 2026.

## Source of Truth

[Master implementation plan](../implementation_plan.md) defines exact interfaces, files, versions, algorithms, and limits. [PRD](../flowguard_prd.md) defines product behavior. This file is an actionable phase view of that plan; it does not replace or override either document.

Master sections 4–6 and PRD section 6 fix grammar, scope, types, source spans, and lowering.

## Entry Gate

Phase 0 contracts/source/budgets are complete.

## Ownership and File Scope

- **Teammate A:** lexer.ts, parser.ts, semantic.ts, lower.ts, graph.ts and corresponding source/grammar/type/CFG tests.
- **Teammate B:** Monaco wiring/language, SourceEditor, initial Toolbar/StatusBar, ExamplesPanel, HelpPanel, ReplaceSourceDialog, file/snapshot adapters.

Full file paths and additional tests/docs are in master section 3. Shared contracts must not change without synchronizing the master plan and affected phases.

## Ordered Tasks

1. Implement the lexer with longest-match operators, comments, exact supported escapes, integer literal bounds, stable token positions, EOF, and first-error behavior.
2. Implement statement parsing and exact precedence/associativity. Enforce initialized declarations, blocks, required braces/semicolons, and parser depth/AST budgets. Assign preorder AST IDs after parsing succeeds.
3. Implement lexical scope resolution, no visible-name shadowing, initializer-before-declaration, exact typing/signatures, blocking literal placeholder validation, and nonblocking dynamic-template notices.
4. Allocate stable symbols/user slots and source-call IDs. Lower expressions left-to-right into finite typed temporary slots and IR instructions.
5. Lower short-circuit booleans into conditional paths that assign a shared result slot. Build if/else joins and while zero-iteration/back-edge paths; preserve structural alternatives for static analysis.
6. Validate every IR target, edge, slot/type/source reference. Link every instruction to source and visible symbols; preserve typed instructions for later taint/codegen use.
7. Integrate actual source editing/file loading and markers; development artifact fixtures must be visibly labeled and cannot appear as a completed release run. File replacement protects dirty text.
8. Document grammar examples in docs/language.md without asserting future compiler stages are implemented.

## Required Validation

- [x] Valid/invalid lexical, grammar, scope, operator, built-in, initialization, and placeholder fixtures pass.
- [x] Nested boolean expressions preserve intended runtime evaluation order in graph lowering.
- [x] CFG tests assert branch targets, joins, loop test/body/back/exit edges, and source links, not layout snapshots alone.
- [x] Unicode/CRLF highlights match source spans; empty/comment-only programs lower to a halt node.
- [x] Compiler-dependent UI Analyze completion and Run remain unavailable until required later stages exist.

## Exit Gate

Typed front-end/IR and editing/file behavior validated: 111 unit tests, six production browser tests, typechecks, builds, and clean lockfile install passed. Exact BOM/newline preservation and live local Monaco worker checked. No taint verdict or verified bytecode is claimed. Source publication is complete; remote CI passed. Phase 2 authorization remains pending.

## State Updates and Continuation

Update [status](../status_update.md), [decision log](../decision_log.md), and [handoff](../context_handoff.md) with completed behavior, checks actually run, remaining issues, and next steps. Stop and ask for any unresolved choice or deviation from the approved plan.

Previous: [Phase 0](phase_0_foundation.md).

Next: [Phase 2](phase_2_analysis_explanations.md).
