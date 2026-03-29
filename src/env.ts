import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.url(),
  API_KEY: z.string().min(1),
  PORT: z.coerce.number().nonnegative().int(),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.url()
});

export const env = envSchema.parse(process.env);
