import { serve } from '@hono/node-server';
import { defaultHook } from 'stoker/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import * as getChapter from './routes/get_chapter.ts';
import * as getChapters from './routes/get_chapters.ts';
import * as uploadChapter from './routes/upload_chapter.ts';

import * as uploadBook from './routes/upload_book.ts';
import * as searchBook from './routes/search_book.ts';

const app = new OpenAPIHono({ defaultHook });

// Books
app.openapi(searchBook.searchBookRoute, searchBook.searchBookHandler);
app.openapi(uploadBook.uploadBookRoute, uploadBook.uploadBookHandler);

// Chapters
app.openapi(getChapter.getChapterRoute, getChapter.getChapterHandler);
app.openapi(getChapters.getChaptersRoute, getChapters.getChaptersHandler);
app.openapi(uploadChapter.uploadChapterRoute, uploadChapter.uploadChapterHandler);

app.doc('/openapi', {
  openapi: '3.0.0',
  info: {
    title: 'Open Books API',
    version: '1.0.0'
  }
});

app.get(
  '/documentation',
  Scalar({
    title: 'Open Books API Documentation',
    sources: [
      {
        url: '/openapi'
      }
    ]
  })
);

app.onError((error, c) => {
  console.error(error);

  return c.json(
    {
      message: 'Internal Server Error'
    },
    HttpStatusCodes.INTERNAL_SERVER_ERROR
  );
});

serve(app);
