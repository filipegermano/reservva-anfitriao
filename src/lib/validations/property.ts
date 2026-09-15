import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(4000)
  .optional()
  .or(z.literal("").transform(() => undefined));

export const createPropertySchema = z.object({
  name: z.string().trim().min(2, "Dê um nome para o imóvel"),
  address: optionalText,
});
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export const updatePropertySchema = z.object({
  name: z.string().trim().min(2, "Dê um nome para o imóvel"),
  address: optionalText,
  coverImageUrl: optionalText,
  welcomeMessage: optionalText,
  wifiName: optionalText,
  wifiPassword: optionalText,
  checkInTime: optionalText,
  checkInInstructions: optionalText,
  checkOutTime: optionalText,
  checkOutInstructions: optionalText,
  houseRules: optionalText,
});
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

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
  name: z.string().trim().min(2, "Dê um nome para a recomendação"),
  description: optionalText,
  mapsUrl: z
    .string()
    .trim()
    .url("Informe um link válido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type RecommendationInput = z.infer<typeof recommendationSchema>;
