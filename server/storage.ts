// Direct S3-compatible storage (AWS S3, Cloudflare R2, or Backblaze B2).
// Uploads and downloads use presigned URLs so files never pass through
// this server's memory. Downloads are served from /storage/{key}, which
// redirects to a short-lived presigned GET URL (see _core/storageProxy.ts).

import crypto from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;

  if (!ENV.s3Bucket || !ENV.s3Region || !ENV.s3AccessKeyId || !ENV.s3SecretAccessKey) {
    throw new Error(
      "Storage config missing: set S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY " +
        "(and S3_ENDPOINT if using R2/B2/a non-AWS provider).",
    );
  }

  _client = new S3Client({
    region: ENV.s3Region,
    endpoint: ENV.s3Endpoint || undefined,
    // R2/B2 use path-style URLs; AWS S3 works fine with either.
    forcePathStyle: !!ENV.s3Endpoint,
    credentials: {
      accessKeyId: ENV.s3AccessKeyId,
      secretAccessKey: ENV.s3SecretAccessKey,
    },
  });
  return _client;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

/**
 * Uploads a file directly to S3 and returns its storage key plus the
 * app-relative URL to fetch it back through the /storage proxy.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const client = getClient();
  const key = appendHashSuffix(normalizeKey(relKey));

  const body =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);

  await client.send(
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return { key, url: `/storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/storage/${key}` };
}

/** Returns a short-lived (default 15 min) presigned GET URL for a stored object. */
export async function storageGetSignedUrl(relKey: string, expiresInSeconds = 900): Promise<string> {
  const client = getClient();
  const key = normalizeKey(relKey);

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: ENV.s3Bucket, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}

export async function storageDelete(relKey: string): Promise<void> {
  const client = getClient();
  const key = normalizeKey(relKey);
  await client.send(new DeleteObjectCommand({ Bucket: ENV.s3Bucket, Key: key }));
}
