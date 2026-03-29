import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    include: ['**/*.{test,spec,integration}.?(c|m)[jt]s?(x)'],
    fileParallelism: false,
    pool: '@cloudflare/vitest-pool-workers',
    poolOptions: {
      workers: {
        wrangler: {
          configPath: './wrangler.jsonc'
        },
        miniflare: {
          d1Databases: {
            DB: 'test-db'
          },
          r2Buckets: {
            BUCKET: 'test-bucket'
          },
          bindings: {
            API_KEY: '1234',
            R2_PUBLIC_URL: 'https://test-r2.example.com'
          }
        }
      }
    }
  }
});
