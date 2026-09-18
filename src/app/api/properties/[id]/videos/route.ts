import { NextResponse } from "next/server";

import { requireOwnedProperty } from "@/lib/api";
import { uploadPropertyVideo } from "@/lib/storage";
import { readVideoUpload } from "@/lib/upload-request";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Envia um vídeo curto usado dentro de uma seção (ex.: como abrir o
 * sofá-cama). A URL retornada é salva no conteúdo da seção.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const upload = await readVideoUpload(request);
  if (upload.error) return upload.error;

  const url = await uploadPropertyVideo(id, "section-video", upload.buffer, upload.file.type);

  return NextResponse.json({ url }, { status: 201 });
}
