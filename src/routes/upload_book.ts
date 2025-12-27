import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import type { RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { createBook } from '../db/repository.ts';
import { ErrorMessage } from '../error_message_schema.ts';
import { apiKeyRequired } from '../api_key_required_middleware.ts';

const UploadBookInput = z.object({
  title: z.string().min(1),
  image_url: z.string().min(1).optional()
});

const UploadBookOutput = z.object({
  book_id: z.uuid()
});

export const uploadBookRoute = createRoute({
  method: 'post',
  path: '/upload-book',
  middleware: [apiKeyRequired],
  request: {
    body: jsonContent(UploadBookInput, 'Upload Book Request')
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(UploadBookOutput, 'Book identifier'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(ErrorMessage, 'Unauthorized')
  }
});

export const uploadBookHandler: RouteHandler<typeof uploadBookRoute> = async (c) => {
  const input = await c.req.valid('json');

  const book = await createBook({
    title: input.title,
    image_url: input.image_url
  });

  return c.json({ book_id: book.id }, HttpStatusCodes.OK);
};
