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

export const imageStorage = {
  saveBuffer
};
