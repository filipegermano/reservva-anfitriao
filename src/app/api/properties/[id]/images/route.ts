import { NextResponse } from "next/server";

import { requireOwnedProperty } from "@/lib/api";
import { uploadPropertyImage } from "@/lib/storage";
import { readImageUpload } from "@/lib/upload-request";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Envia uma imagem usada dentro de uma seção (foto de ambiente, foto do
 * anfitrião, capa da seção). A URL retornada é salva no conteúdo da seção.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const upload = await readImageUpload(request);
  if (upload.error) return upload.error;

  const url = await uploadPropertyImage(id, "section", upload.buffer, upload.file.type);

  return NextResponse.json({ url }, { status: 201 });
}
