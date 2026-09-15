import type { RecommendationCategory } from "@/generated/prisma/client";

export const recommendationCategoryLabels: Record<RecommendationCategory, string> = {
  RESTAURANTE: "Restaurante",
  ATRACAO: "Atração",
  TRANSPORTE: "Transporte",
  MERCADO: "Mercado",
  FARMACIA: "Farmácia",
  OUTRO: "Outro",
};
