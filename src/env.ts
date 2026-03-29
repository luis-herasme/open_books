import { z } from 'zod';

const envSchema = z.object({
  DATABASE_PATH: z.string().min(1),
  API_KEY: z.string().min(1),
  PORT: z.coerce.number().nonnegative().int(),

  // Object Storage
  R2_PUBLIC_URL: z.url(),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1)
});

export const env = envSchema.parse(process.env);
