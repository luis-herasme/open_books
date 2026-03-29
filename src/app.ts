import { z, ZodError } from 'zod';
import { defaultHook } from 'stoker/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import type { AppEnv } from './bindings.ts';
import * as uploadBook from './routes/upload-book.ts';
import * as searchBook from './routes/search-book.ts';
import * as getChapter from './routes/get-chapter.ts';
import * as getChapters from './routes/get-chapters.ts';
import * as uploadChapter from './routes/upload-chapter.ts';
import { ClientError } from './lib/client-error.ts';

export function createApp() {
  const app = new OpenAPIHono<AppEnv>({ defaultHook })
    .openapi(searchBook.searchBookRoute, searchBook.searchBookHandler)
    .openapi(uploadBook.uploadBookRoute, uploadBook.uploadBookHandler)
    .openapi(getChapter.getChapterRoute, getChapter.getChapterHandler)
    .openapi(getChapters.getChaptersRoute, getChapters.getChaptersHandler)
    .openapi(uploadChapter.uploadChapterRoute, uploadChapter.uploadChapterHandler);

  app.doc('/openapi', {
    openapi: '3.0.0',
    info: {
      title: 'Open Books API',
      version: '1.0.0'
    }
  });

  app.get(
    '/',
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

    if (error instanceof ClientError) {
      return c.json(
        {
          message: error.message
        },
        error.status
      );
    }

    if (error instanceof ZodError) {
      return c.json(
        {
          message: z.prettifyError(error)
        },
        HttpStatusCodes.BAD_REQUEST
      );
    }

    return c.json(
      {
        message: 'Internal Server Error'
      },
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    );
  });

  return app;
}

export type App = ReturnType<typeof createApp>;
