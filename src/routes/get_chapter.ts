import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import type { RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { getChapterById } from '../db/repository.ts';
import { ErrorMessage } from '../error_message_schema.ts';

const GetChapterInput = z.object({
  chapter_id: z.uuid()
});

const GetChapterOutput = z.object({
  book_id: z.uuid(),
  content: z.string().nonempty()
});

export const getChapterRoute = createRoute({
  method: 'get',
  path: '/chapter',
  request: {
    query: GetChapterInput
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(GetChapterOutput, 'Chapter Content'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(ErrorMessage, 'Not Found')
  }
});

export const getChapterHandler: RouteHandler<typeof getChapterRoute> = async (c) => {
  const input = await c.req.valid('query');
  const chapter = await getChapterById(input.chapter_id);

  if (chapter === null) {
    return c.json(
      {
        message: 'Chapter not found'
      },
      HttpStatusCodes.NOT_FOUND
    );
  }

  return c.json(
    {
      book_id: chapter.book_id,
      content: chapter.content
    },
    HttpStatusCodes.OK
  );
};
