import type { GuideRecommendation, GuideSectionData } from "@/lib/guide/data";
import { isInfoListType } from "@/lib/guide/sections";

export function recommendationsFor(
  type: "local_tips" | "restaurants",
  recommendations: GuideRecommendation[],
) {
  return recommendations.filter((item) =>
    type === "restaurants" ? item.category === "RESTAURANTE" : item.category !== "RESTAURANTE",
  );
}

/** Se a seção tem algo para mostrar ao hóspede. */
export function sectionHasContent(section: GuideSectionData): boolean {
  if (isInfoListType(section.type)) {
    const content = section.content as {
      intro: string;
      items: { title: string; text: string; illustration?: string | null }[];
    };
    return (
      Boolean(content.intro) ||
      content.items.some((item) => item.title || item.text || item.illustration)
    );
  }

  switch (section.type) {
    case "host": {
      const { name, bio, contacts } = section.content;
      return Boolean(name || bio || contacts.some((contact) => contact.value));
    }
    case "about": {
      const { description, features, guests, bedrooms } = section.content;
      return Boolean(description || features.length || guests || bedrooms);
    }
    case "rooms":
      return section.content.rooms.some((room) => room.name || room.photos.length);
    case "wifi":
      return section.content.networks.some((network) => network.name || network.password);
    case "amenities":
      return section.content.items.length > 0;
    case "rules":
      return section.content.rules.some((rule) => rule.text);
    case "emergency":
      return section.content.contacts.some((contact) => contact.phone);
    case "checkin": {
      const { checkInTime, checkOutTime, checkInInstructions, checkOutInstructions, keyLocation } =
        section.content;
      return Boolean(
        checkInTime || checkOutTime || checkInInstructions || checkOutInstructions || keyLocation,
      );
    }
    // Dicas e restaurantes sempre têm atalhos de busca no mapa.
    case "local_tips":
    case "restaurants":
    case "feedback":
      return true;
    default:
      return false;
  }
}

function flattenText(value: unknown): string[] {
  if (typeof value === "string") return value.startsWith("/api/") || /^https?:/.test(value) ? [] : [value];
  if (Array.isArray(value)) return value.flatMap(flattenText);
  if (value && typeof value === "object") return Object.values(value).flatMap(flattenText);
  return [];
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Busca do hóspede: seções cujo título ou conteúdo contém o termo. */
export function searchSections(
  sections: GuideSectionData[],
  recommendations: GuideRecommendation[],
  query: string,
): { section: GuideSectionData; snippet: string }[] {
  const term = normalize(query.trim());
  if (term.length < 2) return [];

  return sections.flatMap((section) => {
    const texts = [
      ...flattenText(section.content),
      ...(section.type === "local_tips" || section.type === "restaurants"
        ? recommendationsFor(section.type, recommendations).flatMap((item) => [
            item.name,
            item.description ?? "",
          ])
        : []),
    ];
    const match = texts.find((text) => normalize(text).includes(term));
    if (!match && !normalize(section.title).includes(term)) return [];

    const snippet = match ? match.replace(/\s+/g, " ").slice(0, 120) : "";
    return [{ section, snippet }];
  });
}
