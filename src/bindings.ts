import { z } from 'zod';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

export const BindingsSchema = z.object({
  API_KEY: z.string().min(1),
  R2_PUBLIC_URL: z.url()
});

export type Bindings = z.infer<typeof BindingsSchema> & {
  DB: D1Database;
  BUCKET: R2Bucket;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    db: DrizzleD1Database;
  };
};
