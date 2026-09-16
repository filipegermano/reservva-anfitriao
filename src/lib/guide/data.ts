import type {
  GuideSection,
  Property,
  Recommendation,
  RecommendationCategory,
} from "@/generated/prisma/client";
import {
  isSectionType,
  parseSectionContent,
  type SectionContent,
  type SectionType,
} from "@/lib/guide/sections";

export type GuideSectionData = {
  [T in SectionType]: {
    id: string;
    type: T;
    title: string;
    enabled: boolean;
    order: number;
    content: SectionContent<T>;
  };
}[SectionType];

export type GuideRecommendation = {
  id: string;
  category: RecommendationCategory;
  name: string;
  description: string | null;
  mapsUrl: string | null;
};

export type GuideProperty = Pick<
  Property,
  | "id"
  | "name"
  | "slug"
  | "propertyType"
  | "address"
  | "city"
  | "coverImageUrl"
  | "showCover"
  | "welcomeMessage"
  | "shortDescription"
  | "theme"
  | "published"
  | "latitude"
  | "longitude"
>;

/** Tudo que o guia do hóspede precisa para renderizar (serializável). */
export type GuideData = {
  property: GuideProperty;
  sections: GuideSectionData[];
  recommendations: GuideRecommendation[];
};

export const guideInclude = {
  sections: { orderBy: { order: "asc" } },
  recommendations: { orderBy: { order: "asc" } },
} as const;

export function toSectionData(section: GuideSection): GuideSectionData | null {
  if (!isSectionType(section.type)) return null;
  return {
    id: section.id,
    type: section.type,
    title: section.title,
    enabled: section.enabled,
    order: section.order,
    content: parseSectionContent(section.type, section.content),
  } as GuideSectionData;
}

export function toGuideData(
  property: Property & { sections: GuideSection[]; recommendations: Recommendation[] },
): GuideData {
  return {
    property: {
      id: property.id,
      name: property.name,
      slug: property.slug,
      propertyType: property.propertyType,
      address: property.address,
      city: property.city,
      coverImageUrl: property.coverImageUrl,
      showCover: property.showCover,
      welcomeMessage: property.welcomeMessage,
      shortDescription: property.shortDescription,
      theme: property.theme,
      published: property.published,
      latitude: property.latitude,
      longitude: property.longitude,
    },
    sections: property.sections
      .map(toSectionData)
      .filter((section): section is GuideSectionData => section !== null),
    recommendations: property.recommendations.map((recommendation) => ({
      id: recommendation.id,
      category: recommendation.category,
      name: recommendation.name,
      description: recommendation.description,
      mapsUrl: recommendation.mapsUrl,
    })),
  };
}

/** Link de busca no Google Maps perto do imóvel. */
export function mapsSearchUrl(query: string, property: Pick<GuideProperty, "address" | "city" | "latitude" | "longitude">) {
  const near =
    property.latitude != null && property.longitude != null
      ? `${property.latitude},${property.longitude}`
      : [property.address, property.city].filter(Boolean).join(", ");
  const q = near ? `${query} perto de ${near}` : query;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function mapsPlaceUrl(property: Pick<GuideProperty, "address" | "city" | "latitude" | "longitude">) {
  if (property.latitude != null && property.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`;
  }
  const q = [property.address, property.city].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}
