import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import type { RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { getChaptersByBookId } from '../db/repository.ts';

const GetChaptersInput = z.object({
  book_id: z.uuid(),
  offset: z.coerce.number().nonnegative().int().default(0),
  limit: z.coerce.number().nonnegative().int().max(100).default(10)
});

const GetChaptersOutput = z.object({
  chapters: z.array(
    z.object({
      chapter_id: z.uuid()
    })
  )
});

export const getChaptersRoute = createRoute({
  method: 'get',
  path: '/chapters',
  request: {
    query: GetChaptersInput
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(GetChaptersOutput, 'Chapters List')
  }
});

export const getChaptersHandler: RouteHandler<typeof getChaptersRoute> = async (c) => {
  const input = await c.req.valid('query');

  const chapters = await getChaptersByBookId({
    book_id: input.book_id,
    offset: input.offset,
    limit: input.limit
  });

  return c.json(
    {
      chapters: chapters.map((chapter) => ({
        chapter_id: chapter.id
      }))
    },
    HttpStatusCodes.OK
  );
};
