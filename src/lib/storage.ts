import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { env } from "./env";

type S3ClientType = import("@aws-sdk/client-s3").S3Client;

let client: S3ClientType | null = null;

const LOCAL_UPLOAD_DIR = join(process.cwd(), "public", "uploads");

function sanitizeUrl(url: string): string {
  let u = url.replace(/\/+$/, "");
  // Fix duplicate protocol: "https:https://..." → "https://..."
  u = u.replace(/^https?:(https?:\/\/)/, "$1");
  return u;
}

function getEndpoint(): string {
  if (env.R2_ENDPOINT) {
    const ep = sanitizeUrl(env.R2_ENDPOINT);
    if (ep.startsWith("https://") || ep.startsWith("http://")) {
      return ep;
    }
    // Endpoint was set but didn't have a protocol — treat as R2_ACCOUNT_ID fallback
    return `https://${ep}.r2.cloudflarestorage.com`;
  }
  const accountId = env.R2_ACCOUNT_ID.replace(/^https?:\/\//, "");
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

async function getClient(): Promise<S3ClientType> {
  if (!client) {
    const { S3Client } = await import("@aws-sdk/client-s3");
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
  if (!r2Configured()) {
    const buffer = body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : Buffer.from(body);
    const filePath = join(LOCAL_UPLOAD_DIR, key);
    await writeFile(filePath, buffer);
    return `/uploads/${key}`;
  }

  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const cmd = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await (await getClient()).send(cmd);

  if (env.R2_PUBLIC_BASE_URL) {
    const base = env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
    return `${base}/${key}`;
  }
  const endpoint = getEndpoint().replace(/\/+$/, "");
  return `${endpoint}/${env.R2_BUCKET_NAME}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  if (!r2Configured()) {
    const filePath = join(LOCAL_UPLOAD_DIR, key);
    await unlink(filePath);
    return;
  }

  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const cmd = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });
  await (await getClient()).send(cmd);
}
