import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import type { RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { MAX_BOOKS_PER_PAGE } from '../constants.ts';
import { getBooksByTitle } from '../db/repository.ts';

const SearchBookInput = z.object({
  book_title: z.string(),
  offset: z.coerce.number().min(0).int().default(0),
  limit: z.coerce.number().min(1).max(MAX_BOOKS_PER_PAGE).default(10)
});

const SearchBookOutput = z.object({
  books: z.array(
    z.object({
      book_id: z.uuid(),
      book_title: z.string().min(1),
      image_url: z.url().nullable(),
      author: z.string().nullable(),
      description: z.string().nullable()
    })
  ),
  count: z.number().min(0).int()
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
    book_title: input.book_title,
    offset: input.offset,
    limit: input.limit
  });

  return c.json(
    {
      books: books.map((book) => ({
        book_id: book.id,
        book_title: book.title,
        image_url: book.image_url,
        author: book.author,
        description: book.description
      })),
      count
    },
    HttpStatusCodes.OK
  );
};
