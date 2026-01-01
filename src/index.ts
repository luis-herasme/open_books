import { serve } from '@hono/node-server';

import { env } from './env.ts';
import { createApp } from './app.ts';

const app = createApp();

serve({
  fetch: app.fetch,
  port: env.PORT
});
