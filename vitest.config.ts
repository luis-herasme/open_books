import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.{test,spec,integration}.?(c|m)[jt]s?(x)'],
    fileParallelism: false,
    env: loadEnv('test', process.cwd(), '')
  }
});
