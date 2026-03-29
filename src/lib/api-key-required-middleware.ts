import { createMiddleware } from 'hono/factory';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { timingSafeEqual } from 'node:crypto';

import type { AppEnv } from '../bindings.ts';

/**
 * Performs a constant-time comparison of two strings to prevent timing attacks.
 */
function constantTimeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');

  if (bufferA.length !== bufferB.length) {
    // This is very important since timingSafeEqual will throw
    // if the buffers are not of the same length
    timingSafeEqual(bufferB, bufferB);
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

export const apiKeyRequired = createMiddleware<AppEnv>(async (c, next) => {
  const apiKey = c.req.header('x-api-key');

  if (!apiKey) {
    return c.json(
      {
        message: 'Unauthorized'
      },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  if (!constantTimeCompare(apiKey, c.env.API_KEY)) {
    return c.json(
      {
        message: 'Unauthorized'
      },
      HttpStatusCodes.UNAUTHORIZED
    );
  }

  return await next();
});
