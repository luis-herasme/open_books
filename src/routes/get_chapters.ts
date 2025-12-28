import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import type { RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { MAX_CHAPTERS_PER_PAGE } from '../constants.ts';
import { getChaptersByBookId } from '../db/repository.ts';
import { ErrorMessage } from '../lib/error_message_schema.ts';

const GetChaptersInput = z.object({
  book_id: z.uuid(),
  skip: z.coerce.number().min(0).int().default(0),
  take: z.coerce.number().min(1).max(MAX_CHAPTERS_PER_PAGE).default(10)
});

const GetChaptersOutput = z.object({
  chapters: z.array(
    z.object({
      chapter_id: z.uuid(),
      chapter_title: z.string().min(1)
    })
  ),
  count: z.number().min(0).int()
});

export const getChaptersRoute = createRoute({
  method: 'get',
  path: '/chapters',
  request: {
    query: GetChaptersInput
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(GetChaptersOutput, 'Chapters List'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(ErrorMessage, 'Not Found'),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(ErrorMessage, 'Internal Server Error')
  }
});

export const getChaptersHandler: RouteHandler<typeof getChaptersRoute> = async (c) => {
  const input = await c.req.valid('query');

  const result = await getChaptersByBookId({
    book_id: input.book_id,
    offset: input.skip,
    limit: input.take
  });

  if (!result.ok && result.error === 'BOOK_NOT_FOUND') {
    return c.json(
      {
        message: 'Book not found'
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  if (!result.ok) {
    return c.json(
      {
        message: 'Internal Server Error'
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  }

  return c.json(
    {
      chapters: result.data.chapters.map((chapter) => ({
        chapter_id: chapter.id,
        chapter_title: chapter.title
      })),
      count: result.data.count
    },
    HttpStatusCodes.OK
  );
};
