import { z } from 'zod';

export const ErrorMessage = z.object({
  message: z.string().min(1)
});
