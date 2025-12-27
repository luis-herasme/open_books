import { createMiddleware } from 'hono/factory';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { env } from './env.ts';

export const apiKeyRequired = createMiddleware(async (c, next) => {
  const apiKey = c.req.header('x-api-key');

  if (apiKey !== env.API_KEY) {
    return c.json(
      {
        message: 'Unauthorized'
      },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  return await next();
});
