import { prisma } from "@/lib/prisma";
import { collectUploadUrls, deleteUpload, keyFromUploadUrl, propertyPrefix } from "@/lib/storage";

/**
 * Apaga do bucket as imagens do imóvel que deixaram de ser usadas. Uma mesma
 * imagem pode aparecer em mais de um lugar (a capa importada também é foto de
 * ambiente), então só remove o que não é mais referenciado em nenhum lugar.
 */
export async function cleanupUnusedUploads(propertyId: string, candidates: Iterable<string>) {
  const prefix = propertyPrefix(propertyId);
  const owned = [...new Set(candidates)].filter((url) => keyFromUploadUrl(url)?.startsWith(prefix));
  if (owned.length === 0) return;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { coverImageUrl: true, sections: { select: { content: true } } },
  });

  const inUse = collectUploadUrls([
    property?.coverImageUrl,
    ...(property?.sections.map((section) => section.content) ?? []),
  ]);

  await Promise.all(owned.filter((url) => !inUse.has(url)).map((url) => deleteUpload(url)));
}

/** Imagens presentes em `before` que não estão mais em `after`. */
export function removedUploads(before: unknown, after: unknown): string[] {
  const kept = collectUploadUrls(after);
  return [...collectUploadUrls(before)].filter((url) => !kept.has(url));
}
