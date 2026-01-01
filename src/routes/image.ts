import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';
import type { RouteHandler } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { getImageById } from '../db/repository.ts';
import { imageStorage } from '../lib/image_storage.ts';
import { ErrorMessage } from '../lib/error_message_schema.ts';

const ImageSchema = z.any().openapi({
  format: 'binary',
  description: 'Binary image data'
});

export const imageRoute = createRoute({
  method: 'get',
  path: '/images/:imageId',
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        'image/png': {
          schema: ImageSchema
        }
      },
      description: 'The image data'
    },
    [HttpStatusCodes.NOT_FOUND]: {
      content: {
        'application/json': {
          schema: ErrorMessage
        }
      },
      description: 'Image not found'
    }
  }
});

export const imageHandler: RouteHandler<typeof imageRoute> = async (c) => {
  const imageId = c.req.param('imageId');

  const image = await getImageById(imageId);

  if (!image) {
    return c.json({ message: 'Image not found' }, HttpStatusCodes.NOT_FOUND);
  }

  const imageBuffer = await imageStorage.loadBuffer(imageId);

  return new Response(new Uint8Array(imageBuffer), {
    status: HttpStatusCodes.OK,
    headers: {
      'Content-Type': image.content_type
    }
  });
};
