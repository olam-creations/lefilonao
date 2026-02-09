import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? '';
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY ?? '';
const R2_SECRET_KEY = process.env.R2_SECRET_KEY ?? '';
const R2_BUCKET = process.env.R2_BUCKET ?? 'lefilonao-documents';

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

export async function r2Upload(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

export async function r2Download(key: string): Promise<{ body: ReadableStream; contentType: string } | null> {
  try {
    const response = await client.send(new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }));
    if (!response.Body) return null;
    return {
      body: response.Body.transformToWebStream(),
      contentType: response.ContentType ?? 'application/octet-stream',
    };
  } catch {
    return null;
  }
}

export async function r2Delete(key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  }));
}
