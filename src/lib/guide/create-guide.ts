import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import { safeFetch } from "@/lib/import/safe-fetch";
import type { ListingDraft } from "@/lib/import/listing-draft";
import {
  ALLOWED_IMAGE_TYPES,
  isStorageConfigured,
  MAX_UPLOAD_BYTES,
  uploadPropertyImage,
} from "@/lib/storage";
import { sectionMeta, type SectionType } from "@/lib/guide/sections";
import { buildSectionsFromDraft } from "@/lib/guide/draft-sections";

/**
 * Copia as fotos do anúncio para o bucket do app (quando configurado), para o
 * guia não depender de links externos. Fotos que falharem ficam de fora.
 */
async function importPhotos(
  propertyId: string,
  urls: string[],
): Promise<Map<string, string>> {
  const mapping = new Map<string, string>();
  if (!isStorageConfigured()) {
    for (const url of urls) mapping.set(url, url);
    return mapping;
  }

  const queue = [...new Set(urls)];
  const worker = async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      try {
        const { body, contentType } = await safeFetch(url, {
          maxBytes: MAX_UPLOAD_BYTES * 2,
          accept: "image/*",
        });
        if (!ALLOWED_IMAGE_TYPES[contentType]) continue;
        mapping.set(url, await uploadPropertyImage(propertyId, "photo", body, contentType));
      } catch {
        // foto indisponível: segue sem ela
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  return mapping;
}

function replaceUrl(url: string, mapping: Map<string, string>): string {
  return mapping.get(url) ?? "";
}

export async function createGuideFromDraft(accountId: string, draft: ListingDraft) {
  const slug = await generateUniqueSlug(draft.name);

  const property = await prisma.property.create({
    data: {
      accountId,
      slug,
      name: draft.name,
      propertyType: draft.propertyType,
      address: draft.address || null,
      city: draft.city || null,
      welcomeMessage: draft.welcomeMessage || null,
      shortDescription: draft.shortDescription || null,
      theme: draft.theme,
      sourceUrl: draft.sourceUrl,
      latitude: draft.latitude,
      longitude: draft.longitude,
    },
  });

  const cover = draft.photos[0]?.url;
  const mapping = await importPhotos(
    property.id,
    [cover, draft.hostPhotoUrl, ...draft.photos.map((photo) => photo.url)].filter(
      (url): url is string => Boolean(url),
    ),
  );

  const localDraft: ListingDraft = {
    ...draft,
    hostPhotoUrl: draft.hostPhotoUrl ? replaceUrl(draft.hostPhotoUrl, mapping) : "",
    photos: draft.photos
      .map((photo) => ({ ...photo, url: replaceUrl(photo.url, mapping) }))
      .filter((photo) => photo.url),
  };

  const sections = buildSectionsFromDraft(localDraft);

  await prisma.$transaction([
    prisma.property.update({
      where: { id: property.id },
      data: { coverImageUrl: cover ? replaceUrl(cover, mapping) || null : null },
    }),
    ...sections.map((section, order) =>
      prisma.guideSection.create({
        data: {
          propertyId: property.id,
          type: section.type,
          title: sectionMeta[section.type].label,
          order,
          content: section.content,
        },
      }),
    ),
  ]);

  return property;
}

/** Guia em branco: só as seções essenciais, prontas para preencher. */
export async function createBlankGuide(
  accountId: string,
  data: { name: string; address?: string; propertyType?: string },
) {
  const slug = await generateUniqueSlug(data.name);
  const blankTypes: SectionType[] = ["host", "wifi", "checkin", "rules", "amenities", "emergency", "local_tips"];

  return prisma.property.create({
    data: {
      accountId,
      slug,
      name: data.name,
      address: data.address,
      propertyType: data.propertyType,
      welcomeMessage: "Seja muito bem-vindo(a)!",
      sections: {
        create: blankTypes.map((type, order) => ({
          type,
          order,
          title: sectionMeta[type].label,
          content: sectionMeta[type].defaultContent(),
        })),
      },
    },
  });
}
