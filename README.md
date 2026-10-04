# FlowGuard

**A visual static analyzer that explains how untrusted input flows through code.**

FlowGuard is a Principles of Compiler Design project for **4CS501CC25**. It aims to connect compiler fundamentals with a practical security use case: identifying possible input flows into modeled SQL query and shell-command operations.

## Current Status

The project topic is selected and the PRD is drafted. This repository currently contains project documentation. The requirements need review, and an implementation plan has not yet been approved. There is no runnable analyzer yet.

## Proposed Experience

Write a program in a small educational language, analyze it, and inspect an interactive control-flow graph. Select a finding to see its input source, propagation steps, and sensitive argument. Edit the code and analyze it again to compare results.

Planned inspection views include tokens, the syntax tree, symbol information, and incoming/outgoing analysis states. Analysis replay will show how information propagates until results stop changing.

## Compiler Fundamentals

- Lexical analysis and expression parsing.
- Abstract syntax trees, symbol tables, and type checking.
- Control-flow graphs for branches and loops.
- Forward data-flow analysis using a worklist algorithm.
- Taint propagation, conservative merges, and source-linked explanations.

## Proposed Scope

The initial proposal covers a custom language with typed variables, expressions, conditions, loops, and a fixed set of built-in operations. A local visual interface and a command-line tool will share the analysis engine.

The analyzer will model sensitive operations without executing programs, database queries, or shell commands. Findings describe possible explicit input flow under the supported model; they do not prove an exploit or establish that a program is universally secure.

## Project Documentation

- [Product requirements](context/flowguard_prd.md): proposed scope, features, acceptance criteria, and submission requirements.
- [Context index](context/README.md): guide to the project documents.
- [Context handoff](context/context_handoff.md): starting point for a new contributor or coding agent.
- [Decision log](context/decision_log.md): project choices, reasoning, and authorization history.
- [Status update](context/status_update.md): completed work, pending decisions, and next steps.
- [Original project ideas](context/project_ideas.md): exploration history before FlowGuard was selected.

## Getting Started

Start with the PRD and context handoff. Installation and run instructions will be added when the implementation exists. The implementation language and dependency stack remain undecided.

## Development Workflow

Review the PRD, resolve its planning inputs, and approve a detailed implementation plan before building. Keep the decision log, context handoff, and status update synchronized with meaningful changes.

The canonical repository for all FlowGuard work is [harshshah-24/FlowGuard](https://github.com/harshshah-24/FlowGuard).
