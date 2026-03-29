import { z } from 'zod';

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
};
