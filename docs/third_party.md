# Third-Party Dependencies

The FlowGuard repository has no project license, as requested. This document records dependency licenses; it does not grant a license to FlowGuard itself.

Installed direct dependency pins:

- TypeScript 7.0.2 — Apache-2.0.
- Vite 8.3.2 and React plugin 6.1.1 — MIT.
- Vitest 5.0.3 — MIT.
- Playwright test 1.63.0 — Apache-2.0.
- React / React DOM 19.3.0 — MIT.
- Monaco Editor 0.57.0 — MIT.
- React Flow 12.12.0 — MIT.
- Dagre 3.1.1 — MIT.
- Zod 4.6.5 — MIT.

Type-definition packages are pinned in the root manifest; license metadata and notices remain in their installed packages. Consult the root lockfile and each dependency's package metadata/LICENSE/NOTICE files under `node_modules/` for the complete transitive inventory and notices. Preserve applicable notices when packaging third-party assets in future phases.

Monaco/React Flow/Dagre are not integrated into the Phase 0 UI. See [validation notes](testing.md) for the current audit findings before integration.
