import type { DrizzleD1Database } from 'drizzle-orm/d1';

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  API_KEY: string;
  R2_PUBLIC_URL: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    db: DrizzleD1Database;
  };
};
