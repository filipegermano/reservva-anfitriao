import { z } from "zod";

import { propertyTypes, sectionTypes } from "@/lib/guide/sections";
import { isThemeId } from "@/lib/guide/themes";
import { listingDraftSchema } from "@/lib/import/listing-draft";

const optionalText = (max = 4000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal("").transform(() => undefined));

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);

export const createPropertySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("blank"),
    name: z.string().trim().min(2, "Dê um nome para o imóvel").max(120),
    address: optionalText(200),
    propertyType: z.enum(propertyTypes).optional(),
  }),
  z.object({
    mode: z.literal("draft"),
    draft: listingDraftSchema,
    confirmRights: z.literal(true, {
      error: "Confirme que você pode usar o conteúdo do anúncio",
    }),
  }),
]);
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const blankPropertySchema = createPropertySchema.options[0];
export type BlankPropertyInput = z.infer<typeof blankPropertySchema>;

/** Atualização parcial das informações básicas do guia. */
export const updatePropertySchema = z
  .object({
    name: z.string().trim().min(2, "Dê um nome para o imóvel").max(120),
    propertyType: z.enum(propertyTypes).nullable(),
    address: nullableText(200),
    city: nullableText(120),
    welcomeMessage: nullableText(160),
    shortDescription: nullableText(200),
    showCover: z.boolean(),
    theme: z.string().refine(isThemeId, "Tema inválido"),
    published: z.boolean(),
    removeCover: z.literal(true),
    /** Usar uma imagem já enviada (ex.: foto de ambiente) como capa. */
    coverImageUrl: z.string().trim().max(1000),
  })
  .partial();
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export const createSectionSchema = z.object({ type: z.enum(sectionTypes) });

export const updateSectionSchema = z
  .object({
    title: z.string().trim().min(1, "Dê um título para a seção").max(80),
    enabled: z.boolean(),
    content: z.unknown(),
  })
  .partial();

export const reorderSectionsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

export const importListingSchema = z.union([
  z.object({ url: z.string().trim().url("Informe um link válido") }),
  z.object({
    text: z.string().trim().min(40, "Cole um texto um pouco maior do anúncio").max(60_000),
  }),
]);

export const recommendationCategories = [
  "RESTAURANTE",
  "ATRACAO",
  "TRANSPORTE",
  "MERCADO",
  "FARMACIA",
  "OUTRO",
] as const;

export const recommendationSchema = z.object({
  category: z.enum(recommendationCategories),
  name: z.string().trim().min(2, "Dê um nome para a recomendação").max(120),
  description: optionalText(1000),
  mapsUrl: z
    .string()
    .trim()
    .url("Informe um link válido")
    .refine((url) => /^https?:\/\//i.test(url), "Informe um link http(s)")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type RecommendationInput = z.infer<typeof recommendationSchema>;

export const guestFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: optionalText(1000),
  guestName: optionalText(80),
});
export type GuestFeedbackInput = z.infer<typeof guestFeedbackSchema>;
