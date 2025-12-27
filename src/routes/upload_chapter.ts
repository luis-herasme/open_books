import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import type { RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { createChapter } from '../db/repository.ts';
import { ErrorMessage } from '../error_message_schema.ts';
import { apiKeyRequired } from '../api_key_required_middleware.ts';

const MAX_CHAPTERS_PER_BOOK = 10_000;

const UploadChapterInput = z.object({
  book_id: z.uuid(),
  title: z.string().min(1),
  content: z.string().min(1),
  number: z.number().positive().int().max(MAX_CHAPTERS_PER_BOOK)
});

const UploadChapterOutput = z.object({
  chapter_id: z.uuid()
});

export const uploadChapterRoute = createRoute({
  method: 'post',
  path: '/upload-chapter',
  middleware: [apiKeyRequired],
  request: {
    body: jsonContent(UploadChapterInput, 'Upload Chapter Request')
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(UploadChapterOutput, 'Chapter identifier'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(ErrorMessage, 'Unauthorized')
  }
});

export const uploadChapterHandler: RouteHandler<typeof uploadChapterRoute> = async (c) => {
  const input = await c.req.valid('json');

  const chapter = await createChapter({
    book_id: input.book_id,
    title: input.title,
    content: input.content,
    number: input.number
  });

  return c.json(
    {
      chapter_id: chapter.id
    },
    HttpStatusCodes.CREATED
  );
};
