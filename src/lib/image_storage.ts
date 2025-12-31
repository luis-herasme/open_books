import path from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

import { env } from '../env.ts';

async function saveBuffer({ imageId, buffer }: { imageId: string; buffer: Buffer }): Promise<void> {
  await mkdir(env.IMAGES_DIR, { recursive: true });
  const imagePath = path.join(env.IMAGES_DIR, imageId);
  await writeFile(imagePath, buffer);
}

async function loadBuffer(imageId: string): Promise<Buffer> {
  const imagePath = path.join(env.IMAGES_DIR, imageId);
  return await readFile(imagePath);
}

export const imageStorage = {
  saveBuffer,
  loadBuffer
};
