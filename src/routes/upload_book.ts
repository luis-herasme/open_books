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
import { ClientError } from '../lib/client-error.ts';

const SUPPORTED_IMAGE_MIME_TYPES_DESCRIPTION = SUPPORTED_IMAGE_MIME_TYPES.join(', ');

const UploadBookInput = z.object({
  title: z.string().min(1).max(MAX_BOOK_TITLE_LENGTH),
  author: z.string().min(1).max(MAX_BOOK_AUTHOR_LENGTH).optional(),
  description: z.string().min(1).max(MAX_BOOK_DESCRIPTION_LENGTH).optional(),
  image: z.any().optional()
});

// More complex validations are not possible with parseBody
const FormCompatibleUploadBookInput = z.object({
  title: z.string().openapi({
    description: 'Title of the book',
    minLength: 1,
    maxLength: MAX_BOOK_TITLE_LENGTH
  }),
  author: z.string().optional().openapi({
    description: 'Author of the book',
    minLength: 1,
    maxLength: MAX_BOOK_AUTHOR_LENGTH
  }),
  description: z.string().optional().openapi({
    description: 'Description of the book',
    minLength: 1,
    maxLength: MAX_BOOK_DESCRIPTION_LENGTH
  }),
  image: z
    .any()
    .openapi({
      format: 'binary',
      description: `Image data (max ${MAX_UPLOAD_IMAGE_SIZE_BYTES} bytes, supported MIME types: ${SUPPORTED_IMAGE_MIME_TYPES_DESCRIPTION})`
    })
    .optional()
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
          schema: FormCompatibleUploadBookInput
        }
      }
    }
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(UploadBookOutput, 'Book identifier'),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(ErrorMessage, 'Unauthorized'),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(ErrorMessage, 'Bad Request')
  }
});

export const uploadBookHandler: RouteHandler<typeof uploadBookRoute> = async (c) => {
  const formData = await c.req.parseBody();
  const { title, author, description, image } = UploadBookInput.parse(formData);

  let imageBuffer: ImageBuffer | undefined;

  if (image) {
    imageBuffer = await validateImage(image);
  }

  const book = await createBook({
    title,
    author,
    description,
    image: imageBuffer
  });

  return c.json(
    {
      book_id: book.id
    },
    HttpStatusCodes.CREATED
  );
};

type ImageBuffer = {
  buffer: Buffer;
  contentType: SupportedImageMimeType;
};

export async function validateImage(image: File): Promise<ImageBuffer> {
  if (image.size > MAX_UPLOAD_IMAGE_SIZE_BYTES) {
    throw new ClientError(`Image size must be less than ${MAX_UPLOAD_IMAGE_SIZE_BYTES} bytes`);
  }

  const contentTypeResult = SupportedImageMimeType.safeParse(image.type);
  if (!contentTypeResult.success) {
    throw new ClientError('Image must be a supported MIME type');
  }

  const arrayBuffer = await image.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    contentType: contentTypeResult.data
  };
}
