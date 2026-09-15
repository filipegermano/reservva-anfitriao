import { Bus, Landmark, MapPin, Pill, ShoppingCart, Utensils } from "lucide-react";

import type { RecommendationCategory } from "@/generated/prisma/client";

export const recommendationCategoryLabels: Record<RecommendationCategory, string> = {
  RESTAURANTE: "Restaurante",
  ATRACAO: "Atração",
  TRANSPORTE: "Transporte",
  MERCADO: "Mercado",
  FARMACIA: "Farmácia",
  OUTRO: "Outro",
};

export const recommendationCategoryIcons: Record<
  RecommendationCategory,
  React.ComponentType<{ className?: string }>
> = {
  RESTAURANTE: Utensils,
  ATRACAO: Landmark,
  TRANSPORTE: Bus,
  MERCADO: ShoppingCart,
  FARMACIA: Pill,
  OUTRO: MapPin,
};
