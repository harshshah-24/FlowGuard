import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node', include: ['packages/*/test/**/*.test.ts', 'apps/web/test/unit/**/*.test.ts'], testTimeout: 5000 } });
