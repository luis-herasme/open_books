import { z } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { jsonContent } from 'stoker/openapi/helpers';
import type { RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { createBook } from '../db/repository.ts';
import { SupportedImageMimeType } from '../db/schema.ts';
import { ErrorMessage } from '../lib/error_message_schema.ts';
import { apiKeyRequired } from '../lib/api_key_required_middleware.ts';
import {
  MAX_BOOK_TITLE_LENGTH,
  MAX_BOOK_AUTHOR_LENGTH,
  MAX_BOOK_DESCRIPTION_LENGTH,
  MAX_UPLOAD_IMAGE_SIZE_BYTES,
  SUPPORTED_IMAGE_MIME_TYPES
} from '../constants.ts';

const UploadBookInput = z.object({
  title: z.string().min(1).max(MAX_BOOK_TITLE_LENGTH),
  author: z.string().min(1).max(MAX_BOOK_AUTHOR_LENGTH).optional(),
  description: z.string().min(1).max(MAX_BOOK_DESCRIPTION_LENGTH).optional(),
  image: z.file().mime(SUPPORTED_IMAGE_MIME_TYPES).max(MAX_UPLOAD_IMAGE_SIZE_BYTES).optional()
});

const UploadBookOutput = z.object({
  book_id: z.uuid()
});

export const uploadBookRoute = createRoute({
  method: 'post',
  path: '/upload-book',
  middleware: [apiKeyRequired],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: UploadBookInput
        }
      }
    }
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(UploadBookOutput, 'Book identifier'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(ErrorMessage, 'Unauthorized')
  }
});

export const uploadBookHandler: RouteHandler<typeof uploadBookRoute> = async (c) => {
  const input = await c.req.valid('form');

  let image:
    | {
        buffer: Buffer;
        contentType: SupportedImageMimeType;
      }
    | undefined;

  if (input.image) {
    const arrayBuffer = await input.image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = SupportedImageMimeType.parse(input.image.type);

    image = {
      buffer,
      contentType
    };
  }

  const book = await createBook({
    title: input.title,
    author: input.author,
    description: input.description,
    image
  });

  return c.json(
    {
      book_id: book.id
    },
    HttpStatusCodes.CREATED
  );
};
