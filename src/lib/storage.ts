import { S3Client } from "@aws-sdk/client-s3";

const globalForS3 = globalThis as unknown as { s3: S3Client | undefined };

export const s3 = globalForS3.s3 ?? new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL,
  region: process.env.AWS_DEFAULT_REGION ?? "auto",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForS3.s3 = s3;
}

export const uploadsBucket = process.env.AWS_S3_BUCKET_NAME ?? "";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const UPLOAD_PREFIX = "/api/uploads/";

/** Extrai a key do bucket a partir de uma coverImageUrl gerada por este app. */
export function keyFromUploadUrl(url: string | null): string | null {
  if (!url || !url.startsWith(UPLOAD_PREFIX)) return null;
  return url.slice(UPLOAD_PREFIX.length);
}
