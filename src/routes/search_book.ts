import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import type { RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { MAX_BOOKS_PER_PAGE } from '../constants.ts';
import { getBooksByTitle } from '../db/repository.ts';

const SearchBookInput = z.object({
  book_title: z.string(),
  skip: z.coerce.number().min(0).int().default(0),
  take: z.coerce.number().min(1).max(MAX_BOOKS_PER_PAGE).default(10)
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
  total: z.number().min(0).int().openapi({
    description: 'The total number of books matching the search criteria'
  })
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

  const { books, total } = await getBooksByTitle({
    book_title: input.book_title,
    offset: input.skip,
    limit: input.take
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
      total
    },
    HttpStatusCodes.OK
  );
};
