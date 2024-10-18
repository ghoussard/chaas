import {defineWorkspace} from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vite.config.ts',
    test: {
      name: 'unit',
      include: ['**/*.unit.test.ts?(x)'],
      environment: 'jsdom',
    },
  },
  {
    extends: './vite.config.ts',
    test: {
      name: 'integration',
      include: ['**/*.integration.test.ts?(x)'],
      environment: 'jsdom',
    },
  },
]);
