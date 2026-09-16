import sharp from "sharp";

import { imageSrc } from "@/lib/guide/contacts";
import { safeFetch } from "@/lib/import/safe-fetch";
import { readUpload } from "@/lib/storage";

const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

/**
 * Prepara a foto de capa para o cartaz: o gerador de PDF só aceita JPG/PNG,
 * então convertemos (inclusive WebP) e reduzimos o tamanho para o PDF não
 * ficar pesado. Retorna null se a imagem não puder ser usada.
 */
export async function loadPosterImage(url: string | null): Promise<string | null> {
  const src = imageSrc(url);
  if (!src) return null;

  try {
    const source = src.startsWith("/api/uploads/")
      ? await readUpload(src)
      : (await safeFetch(src, { maxBytes: MAX_SOURCE_BYTES, accept: "image/*" })).body;
    if (!source) return null;

    const jpeg = await sharp(source)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (error) {
    console.error("[poster] foto de capa indisponível", error);
    return null;
  }
}
