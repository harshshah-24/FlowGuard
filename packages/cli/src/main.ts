import { ANALYZER_VERSION } from '@flowguard/core';
// Phase 0 exposes no analyze/run command; the real adapter is scheduled later.
if (process.argv.slice(2).length === 1 && process.argv[2] === '--version') {
  process.stdout.write(`FlowGuard ${ANALYZER_VERSION} (Phase 0 foundation)\n`);
} else {
  process.stderr.write('FlowGuard Phase 0: compiler and execution commands are not implemented yet.\n');
  process.exitCode = 2;
}
