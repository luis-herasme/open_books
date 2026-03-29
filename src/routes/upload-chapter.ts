import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import type { RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { drizzle } from 'drizzle-orm/d1';

import type { AppEnv } from '../bindings.ts';
import { createChapter } from '../db/repository.ts';
import { ErrorMessage } from '../lib/error-message-schema.ts';
import { apiKeyRequired } from '../lib/api-key-required-middleware.ts';
import {
  MAX_CHAPTERS_PER_BOOK,
  MAX_CHAPTER_TITLE_LENGTH,
  MAX_CHAPTER_CONTENT_LENGTH
} from '../constants.ts';

const UploadChapterInput = z.object({
  book_id: z.uuid(),
  title: z.string().min(1).max(MAX_CHAPTER_TITLE_LENGTH),
  content: z.string().min(1).max(MAX_CHAPTER_CONTENT_LENGTH),
  number: z.number().min(1).int().max(MAX_CHAPTERS_PER_BOOK)
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

export const uploadChapterHandler: RouteHandler<typeof uploadChapterRoute, AppEnv> = async (c) => {
  const input = await c.req.valid('json');

  const db = drizzle(c.env.DB);

  const chapter = await createChapter(db, {
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
