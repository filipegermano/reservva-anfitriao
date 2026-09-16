import { NextResponse } from "next/server";

import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/storage";

/** Lê e valida a imagem enviada via multipart (campo "file"). */
export async function readImageUpload(
  request: Request,
): Promise<{ file: File; buffer: Buffer; error?: never } | { error: NextResponse }> {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return { error: NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 }) };
  }

  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    return {
      error: NextResponse.json(
        { error: "Formato não suportado. Envie JPG, PNG ou WebP." },
        { status: 400 },
      ),
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      error: NextResponse.json(
        { error: "Arquivo muito grande. Tamanho máximo: 5MB." },
        { status: 400 },
      ),
    };
  }

  return { file, buffer: Buffer.from(await file.arrayBuffer()) };
}
