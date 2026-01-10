import path from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { z } from 'zod';
import * as HttpStatusCodes from 'stoker/http-status-codes';

import { env } from '../env.ts';
import { ClientError } from './client-error.ts';

const UUIDSchema = z.string().uuid();

async function saveBuffer({ imageId, buffer }: { imageId: string; buffer: Buffer }): Promise<void> {
  const validationResult = UUIDSchema.safeParse(imageId);
  if (!validationResult.success) {
    throw new ClientError({
      message: 'Invalid image ID format',
      status: HttpStatusCodes.BAD_REQUEST
    });
  }

  await mkdir(env.IMAGES_DIR, { recursive: true });
  const imagePath = path.join(env.IMAGES_DIR, imageId);
  await writeFile(imagePath, buffer);
}

async function loadBuffer(imageId: string): Promise<Buffer> {
  const validationResult = UUIDSchema.safeParse(imageId);
  if (!validationResult.success) {
    throw new ClientError({
      message: 'Invalid image ID format',
      status: HttpStatusCodes.BAD_REQUEST
    });
  }

  const imagePath = path.join(env.IMAGES_DIR, imageId);
  return await readFile(imagePath);
}

export const imageStorage = {
  saveBuffer,
  loadBuffer
};
