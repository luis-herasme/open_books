import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.url(),
  API_KEY: z.string().nonempty(),
  PORT: z.coerce.number().nonnegative().int()
});

export const env = envSchema.parse(process.env);
