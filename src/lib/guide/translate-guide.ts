import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { translateTexts } from "@/lib/ai";
import { guideInclude, toGuideData } from "@/lib/guide/data";
import {
  chunkTexts,
  collectGuideTexts,
  textsFingerprint,
  type GuideTranslation,
  type TranslationLanguage,
} from "@/lib/guide/translation";

/**
 * Traduz o conteúdo do guia para um idioma e salva. Reaproveita as traduções
 * de textos que não mudaram desde a última vez, então atualizar uma tradução
 * só manda para a IA o que é novo ou foi editado.
 */
export async function translateGuide(
  propertyId: string,
  language: TranslationLanguage,
): Promise<GuideTranslation> {
  const property = await prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
    include: guideInclude,
  });
  const guide = toGuideData(property);
  const texts = collectGuideTexts(guide);

  const previous = guide.translations[language];
  const previousSources = previous ? (previousSourcesOf(property.translations, language) ?? {}) : {};

  const reused: Record<string, string> = {};
  const pending: Record<string, string> = {};
  for (const [key, value] of Object.entries(texts)) {
    const known = previous?.texts[key];
    if (known && previousSources[key] === value) reused[key] = known;
    else pending[key] = value;
  }

  const translated: Record<string, string> = { ...reused };
  for (const chunk of chunkTexts(pending)) {
    Object.assign(translated, await translateTexts(chunk, language));
  }

  const translation: GuideTranslation = {
    translatedAt: new Date().toISOString(),
    fingerprint: textsFingerprint(texts),
    texts: translated,
  };

  // Relê antes de gravar para não apagar a tradução de outro idioma feita
  // enquanto esta estava em andamento.
  const latest = await prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
    select: { translations: true },
  });
  const stored = (latest.translations ?? {}) as Prisma.InputJsonObject;
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      translations: {
        ...stored,
        [language]: translation,
        // Guarda os originais usados, para saber o que mudou na próxima vez.
        [`${language}Sources`]: texts,
      },
    },
  });

  return translation;
}

function previousSourcesOf(raw: unknown, language: TranslationLanguage) {
  const sources = (raw as Record<string, unknown> | null)?.[`${language}Sources`];
  return sources && typeof sources === "object" ? (sources as Record<string, string>) : null;
}

export async function removeTranslation(propertyId: string, language: TranslationLanguage) {
  const property = await prisma.property.findUniqueOrThrow({
    where: { id: propertyId },
    select: { translations: true },
  });
  const stored = { ...((property.translations ?? {}) as Prisma.InputJsonObject) };
  delete stored[language];
  delete stored[`${language}Sources`];
  await prisma.property.update({ where: { id: propertyId }, data: { translations: stored } });
}
