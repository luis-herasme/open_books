import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import type { RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { getBooksByTitle } from '../db/repository.ts';

const SearchBookInput = z.object({
  term: z.string().nonempty(),
  offset: z.coerce.number().nonnegative().int().default(0),
  limit: z.coerce.number().nonnegative().int().default(10)
});

const SearchBookOutput = z.object({
  books: z.array(
    z.object({
      book_id: z.uuid(),
      book_title: z.string().nonempty(),
      image_url: z.string().nullable()
    })
  ),
  count: z.number().nonnegative().int()
});

export const searchBookRoute = createRoute({
  method: 'get',
  path: '/search-book',
  request: {
    query: SearchBookInput
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(SearchBookOutput, 'Book Results')
  }
});

export const searchBookHandler: RouteHandler<typeof searchBookRoute> = async (c) => {
  const input = await c.req.valid('query');

  const { books, count } = await getBooksByTitle({
    term: input.term,
    offset: input.offset,
    limit: input.limit
  });

  return c.json(
    {
      books: books.map((book) => ({
        book_id: book.id,
        book_title: book.title,
        image_url: book.image_url
      })),
      count
    },
    HttpStatusCodes.OK
  );
};
