import { NextResponse } from "next/server";

import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_VIDEO_BYTES,
} from "@/lib/storage";

type UploadResult = { file: File; buffer: Buffer; error?: never } | { error: NextResponse };

/** Lê e valida a imagem enviada via multipart (campo "file"). */
export async function readImageUpload(request: Request): Promise<UploadResult> {
  return readUpload(request, {
    allowed: ALLOWED_IMAGE_TYPES,
    maxBytes: MAX_UPLOAD_BYTES,
    formatError: "Formato não suportado. Envie JPG, PNG ou WebP.",
    sizeError: "Arquivo muito grande. Tamanho máximo: 5MB.",
  });
}

/** Lê e valida o vídeo enviado via multipart (campo "file"). */
export async function readVideoUpload(request: Request): Promise<UploadResult> {
  return readUpload(request, {
    allowed: ALLOWED_VIDEO_TYPES,
    maxBytes: MAX_VIDEO_BYTES,
    formatError: "Formato não suportado. Envie um vídeo MP4.",
    sizeError: "Vídeo muito grande. Tamanho máximo: 25MB.",
  });
}

async function readUpload(
  request: Request,
  {
    allowed,
    maxBytes,
    formatError,
    sizeError,
  }: { allowed: Record<string, string>; maxBytes: number; formatError: string; sizeError: string },
): Promise<UploadResult> {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return { error: NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 }) };
  }

  if (!allowed[file.type]) {
    return { error: NextResponse.json({ error: formatError }, { status: 400 }) };
  }

  if (file.size > maxBytes) {
    return { error: NextResponse.json({ error: sizeError }, { status: 400 }) };
  }

  return { file, buffer: Buffer.from(await file.arrayBuffer()) };
}
