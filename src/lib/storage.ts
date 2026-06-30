import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

let client: S3Client | null = null;

function getEndpoint(): string {
  if (env.R2_ENDPOINT) return env.R2_ENDPOINT;
  return `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: getEndpoint(),
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export function r2Configured(): boolean {
  return !!(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME);
}

export async function uploadFile(
  key: string,
  body: Uint8Array | Blob,
  contentType: string,
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await getClient().send(cmd);

  if (env.R2_PUBLIC_BASE_URL) {
    const base = env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
    return `${base}/${key}`;
  }
  const endpoint = getEndpoint().replace(/\/+$/, "");
  return `${endpoint}/${env.R2_BUCKET_NAME}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  const cmd = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });
  await getClient().send(cmd);
}
