type SaveBufferParams = {
  bucket: R2Bucket;
  buffer: Buffer;
  imageId: string;
  contentType: string;
};

async function saveBuffer({ bucket, imageId, buffer, contentType }: SaveBufferParams): Promise<void> {
  await bucket.put(imageId, buffer, {
    httpMetadata: { contentType }
  });
}

type GetPublicUrlParams = {
  publicUrl: string;
  imageId: string;
};

function getPublicUrl({ publicUrl, imageId }: GetPublicUrlParams): string {
  return `${publicUrl}/${imageId}`;
}

export const imageStorage = {
  saveBuffer,
  getPublicUrl
};
