import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

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

/** Vídeos curtos de demonstração (como abrir o sofá-cama, usar o chuveiro). */
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

export const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
};

const UPLOAD_PREFIX = "/api/uploads/";

/** Sem bucket configurado, fotos importadas ficam apontando para a origem. */
export function isStorageConfigured(): boolean {
  return Boolean(
    uploadsBucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
  );
}

/** Extrai a key do bucket a partir de uma URL gerada por este app. */
export function keyFromUploadUrl(url: string | null): string | null {
  if (!url || !url.startsWith(UPLOAD_PREFIX)) return null;
  return url.slice(UPLOAD_PREFIX.length);
}

export function propertyPrefix(propertyId: string): string {
  return `properties/${propertyId}/`;
}

/** Envia uma imagem para o bucket e retorna a URL servida pelo app. */
export async function uploadPropertyImage(
  propertyId: string,
  kind: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  return uploadPropertyFile(propertyId, kind, body, contentType, ALLOWED_IMAGE_TYPES);
}

/** Envia um vídeo para o bucket e retorna a URL servida pelo app. */
export async function uploadPropertyVideo(
  propertyId: string,
  kind: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  return uploadPropertyFile(propertyId, kind, body, contentType, ALLOWED_VIDEO_TYPES);
}

async function uploadPropertyFile(
  propertyId: string,
  kind: string,
  body: Buffer,
  contentType: string,
  allowed: Record<string, string>,
): Promise<string> {
  const extension = allowed[contentType];
  if (!extension) throw new Error("Formato não suportado");

  const key = `${propertyPrefix(propertyId)}${kind}-${randomUUID()}.${extension}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: uploadsBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return `${UPLOAD_PREFIX}${key}`;
}

export async function deleteUpload(url: string | null): Promise<void> {
  const key = keyFromUploadUrl(url);
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: uploadsBucket, Key: key })).catch(() => null);
}

/** Remove todos os arquivos de um imóvel (capa, fotos de ambientes, anfitrião). */
export async function deletePropertyUploads(propertyId: string): Promise<void> {
  if (!isStorageConfigured()) return;

  let continuationToken: string | undefined;
  do {
    const listed = await s3.send(
      new ListObjectsV2Command({
        Bucket: uploadsBucket,
        Prefix: propertyPrefix(propertyId),
        ContinuationToken: continuationToken,
      }),
    );
    const keys = (listed.Contents ?? []).flatMap((object) => (object.Key ? [{ Key: object.Key }] : []));
    if (keys.length > 0) {
      await s3.send(
        new DeleteObjectsCommand({ Bucket: uploadsBucket, Delete: { Objects: keys, Quiet: true } }),
      );
    }
    continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (continuationToken);
}

/** Todas as URLs de upload deste app presentes num valor JSON. */
export function collectUploadUrls(value: unknown, found = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    if (keyFromUploadUrl(value)) found.add(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectUploadUrls(item, found);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectUploadUrls(item, found);
  }
  return found;
}

/** Lê do bucket um arquivo enviado por este app (ex.: foto de capa). */
export async function readUpload(url: string): Promise<Buffer | null> {
  const key = keyFromUploadUrl(url);
  if (!key || !isStorageConfigured()) return null;
  const object = await s3.send(new GetObjectCommand({ Bucket: uploadsBucket, Key: key }));
  const bytes = await object.Body?.transformToByteArray();
  return bytes ? Buffer.from(bytes) : null;
}
