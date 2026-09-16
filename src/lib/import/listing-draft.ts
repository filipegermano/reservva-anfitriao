import { z } from "zod";

import { propertyTypes } from "@/lib/guide/sections";
import { defaultThemeId, isThemeId } from "@/lib/guide/themes";

const text = (max: number) => z.string().trim().max(max).catch("");
const count = z.coerce.number().int().min(0).max(999).catch(0);

/**
 * Rascunho de guia extraído de um anúncio (Airbnb, Booking, texto colado).
 * É o que o anfitrião revisa antes de criar o guia.
 */
export const listingDraftSchema = z.object({
  sourceUrl: z.string().url().nullable().catch(null),
  name: z.string().trim().min(2, "Dê um nome para o imóvel").max(120),
  propertyType: z.enum(propertyTypes).catch("Apartamento"),
  address: text(200),
  city: text(120),
  theme: z
    .string()
    .refine(isThemeId)
    .catch(defaultThemeId),
  hostName: text(120),
  hostPhotoUrl: text(1000),
  hostBio: text(2000),
  description: text(4000),
  shortDescription: text(160),
  welcomeMessage: text(160),
  guests: count,
  bedrooms: count,
  beds: count,
  bathrooms: count,
  amenities: z.array(text(120)).max(200).catch([]),
  features: z.array(text(200)).max(50).catch([]),
  rules: z.array(text(1000)).max(50).catch([]),
  safety: z.array(text(300)).max(30).catch([]),
  checkInTime: text(60),
  checkOutTime: text(60),
  checkInInstructions: text(2000),
  latitude: z.number().min(-90).max(90).nullable().catch(null),
  longitude: z.number().min(-180).max(180).nullable().catch(null),
  photos: z
    .array(z.object({ url: z.string().url(), room: text(120) }))
    .max(60)
    .catch([]),
  rooms: z
    .array(z.object({ name: text(120), description: text(1000) }))
    .max(40)
    .catch([]),
});

export type ListingDraft = z.infer<typeof listingDraftSchema>;

export function emptyDraft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  return listingDraftSchema.parse({ name: "Meu imóvel", sourceUrl: null, ...overrides });
}

/** Primeira frase (ou trecho) de um texto, para a descrição curta. */
export function firstSentence(value: string, max = 120): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const match = clean.match(/^(.+?[.!?])(\s|$)/);
  const sentence = match ? match[1] : clean;
  if (sentence.length <= max) return sentence;
  return `${sentence.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

/** Nome curto do imóvel ("Beach Haus | Frente mar..." → "Beach Haus"). */
export function shortName(name: string): string {
  return name.split(/\s[|·–—-]\s/)[0].trim() || name;
}

export function defaultWelcomeMessage(name: string): string {
  return `Seja muito bem-vindo(a) ao ${shortName(name)}!`.slice(0, 160);
}
