import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { env } from '../env.ts';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY
  }
});

async function saveBuffer({
  imageId,
  buffer,
  contentType
}: {
  imageId: string;
  buffer: Buffer;
  contentType: string;
}): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: imageId,
      Body: buffer,
      ContentType: contentType
    })
  );
}

function getPublicUrl(imageId: string): string {
  return `${env.R2_PUBLIC_URL}/${imageId}`;
}

export const imageStorage = {
  saveBuffer,
  getPublicUrl
};
