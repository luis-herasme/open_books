import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.url(),
  API_KEY: z.string().min(1),
  PORT: z.coerce.number().nonnegative().int(),
  IMAGES_DIR: z.string().min(1).default('images'),
  BASE_URL: z.url()
});

export const env = envSchema.parse(process.env);
