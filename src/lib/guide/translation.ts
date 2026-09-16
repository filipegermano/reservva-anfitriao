import { z } from "zod";

import type { GuideData, GuideSectionData } from "@/lib/guide/data";
import { parseSectionContent, type SectionType } from "@/lib/guide/sections";

/** Idiomas para os quais o guia pode ser traduzido (o original é português). */
export const translationLanguages = ["en", "es"] as const;
export type TranslationLanguage = (typeof translationLanguages)[number];
export type GuideLanguage = "pt" | TranslationLanguage;

export const languageLabels: Record<GuideLanguage, { name: string; short: string; flag: string }> = {
  pt: { name: "Português", short: "PT", flag: "🇧🇷" },
  en: { name: "English", short: "EN", flag: "🇺🇸" },
  es: { name: "Español", short: "ES", flag: "🇪🇸" },
};

export function isTranslationLanguage(value: string): value is TranslationLanguage {
  return (translationLanguages as readonly string[]).includes(value);
}

/**
 * Campos de texto livre de cada tipo de seção que devem ser traduzidos.
 * `*` percorre os itens de uma lista. Nomes de pessoas, redes Wi-Fi, senhas,
 * telefones e links ficam de fora de propósito.
 */
const translatablePaths: Record<SectionType, string[]> = {
  host: ["title", "bio", "cohosts.*.role"],
  about: ["description", "features.*"],
  rooms: ["rooms.*.name", "rooms.*.description"],
  wifi: ["notes", "tips"],
  amenities: ["items.*"],
  rules: ["rules.*.text"],
  emergency: ["contacts.*.name"],
  checkin: [
    "checkInTime",
    "checkOutTime",
    "checkInInstructions",
    "checkOutInstructions",
    "keyLocation",
  ],
  local_tips: ["intro"],
  restaurants: ["intro"],
  feedback: ["heading", "description", "incentiveMessage", "thanksMessage"],
  transport: ["intro", "items.*.title", "items.*.text"],
  instructions: ["intro", "items.*.title", "items.*.text"],
  safety: ["intro", "items.*.title", "items.*.text"],
  events: ["intro", "items.*.title", "items.*.text"],
  activities: ["intro", "items.*.title", "items.*.text"],
  services: ["intro", "items.*.title", "items.*.text"],
  accessibility: ["intro", "items.*.title", "items.*.text"],
};

const propertyFields = ["name", "welcomeMessage", "shortDescription", "propertyType", "city"] as const;

type Json = unknown;

/** Lista os caminhos concretos (com índices) que batem com um padrão. */
function expandPath(value: Json, pattern: string[], prefix: string[] = []): string[][] {
  if (pattern.length === 0) return [prefix];
  const [head, ...rest] = pattern;
  if (head === "*") {
    return Array.isArray(value)
      ? value.flatMap((item, index) => expandPath(item, rest, [...prefix, String(index)]))
      : [];
  }
  if (value && typeof value === "object" && head in value) {
    return expandPath((value as Record<string, Json>)[head], rest, [...prefix, head]);
  }
  return [];
}

function getAt(value: Json, path: string[]): Json {
  return path.reduce<Json>(
    (current, key) =>
      current && typeof current === "object" ? (current as Record<string, Json>)[key] : undefined,
    value,
  );
}

function setAt(value: Json, path: string[], next: string): void {
  const parent = getAt(value, path.slice(0, -1));
  if (parent && typeof parent === "object") {
    (parent as Record<string, Json>)[path[path.length - 1]] = next;
  }
}

function sectionTexts(section: GuideSectionData): [string, string][] {
  const entries: [string, string][] = [];
  if (section.title.trim()) entries.push([`s.${section.id}.title`, section.title]);
  for (const pattern of translatablePaths[section.type]) {
    for (const path of expandPath(section.content, pattern.split("."))) {
      const text = getAt(section.content, path);
      if (typeof text === "string" && text.trim()) {
        entries.push([`s.${section.id}.c.${path.join(".")}`, text]);
      }
    }
  }
  return entries;
}

/** Todos os textos do guia que precisam de tradução, por chave estável. */
export function collectGuideTexts(guide: GuideData): Record<string, string> {
  const entries: [string, string][] = [];
  for (const field of propertyFields) {
    const value = guide.property[field];
    if (typeof value === "string" && value.trim()) entries.push([`p.${field}`, value]);
  }
  for (const section of guide.sections) entries.push(...sectionTexts(section));
  for (const item of guide.recommendations) {
    if (item.description?.trim()) entries.push([`r.${item.id}.description`, item.description]);
  }
  return Object.fromEntries(entries);
}

/** Impressão digital dos textos (FNV-1a), para saber se a tradução ficou velha. */
export function textsFingerprint(texts: Record<string, string>): string {
  let hash = 0x811c9dc5;
  const input = JSON.stringify(Object.entries(texts).sort(([a], [b]) => a.localeCompare(b)));
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export const guideTranslationSchema = z.object({
  translatedAt: z.string(),
  fingerprint: z.string(),
  texts: z.record(z.string(), z.string()),
});

export type GuideTranslation = z.infer<typeof guideTranslationSchema>;

export const guideTranslationsSchema = z
  .object({
    en: guideTranslationSchema.optional(),
    es: guideTranslationSchema.optional(),
  })
  .catch({});

export type GuideTranslations = z.infer<typeof guideTranslationsSchema>;

export function parseTranslations(raw: unknown): GuideTranslations {
  return guideTranslationsSchema.parse(raw ?? {});
}

export type TranslationStatus = "missing" | "current" | "outdated";

export function translationStatus(
  guide: GuideData,
  language: TranslationLanguage,
): TranslationStatus {
  const translation = guide.translations[language];
  if (!translation) return "missing";
  return translation.fingerprint === textsFingerprint(collectGuideTexts(guide))
    ? "current"
    : "outdated";
}

export function availableLanguages(guide: GuideData): GuideLanguage[] {
  return ["pt", ...translationLanguages.filter((language) => guide.translations[language])];
}

/**
 * Aplica a tradução ao guia. Textos sem tradução (novos ou editados depois)
 * continuam no original, então o guia nunca fica com campos vazios.
 */
export function applyTranslation(guide: GuideData, language: GuideLanguage): GuideData {
  if (language === "pt") return guide;
  const texts = guide.translations[language]?.texts;
  if (!texts) return guide;

  const property = { ...guide.property };
  for (const field of propertyFields) {
    const translated = texts[`p.${field}`];
    if (translated) property[field] = translated;
  }

  const sections = guide.sections.map((section) => {
    const content = structuredClone(section.content) as Json;
    const prefix = `s.${section.id}.c.`;
    for (const [key, value] of Object.entries(texts)) {
      if (key.startsWith(prefix)) setAt(content, key.slice(prefix.length).split("."), value);
    }
    return {
      ...section,
      title: texts[`s.${section.id}.title`] ?? section.title,
      // Revalida para garantir o formato mesmo se o conteúdo mudou desde a tradução.
      content: parseSectionContent(section.type, content),
    } as GuideSectionData;
  });

  const recommendations = guide.recommendations.map((item) => ({
    ...item,
    description: texts[`r.${item.id}.description`] ?? item.description,
  }));

  return { ...guide, property, sections, recommendations };
}

/** Divide os textos em lotes para não mandar pedidos grandes demais à IA. */
export function chunkTexts(
  texts: Record<string, string>,
  { maxItems = 60, maxChars = 6000 } = {},
): Record<string, string>[] {
  const chunks: Record<string, string>[] = [];
  let current: Record<string, string> = {};
  let size = 0;
  let count = 0;
  for (const [key, value] of Object.entries(texts)) {
    if (count > 0 && (count >= maxItems || size + value.length > maxChars)) {
      chunks.push(current);
      current = {};
      size = 0;
      count = 0;
    }
    current[key] = value;
    size += value.length;
    count += 1;
  }
  if (count > 0) chunks.push(current);
  return chunks;
}
