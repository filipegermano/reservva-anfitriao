import type { ListingDraft } from "@/lib/import/listing-draft";
import {
  defaultSectionOrder,
  parseSectionContent,
  sectionMeta,
  type SectionContent,
  type SectionType,
} from "@/lib/guide/sections";

export type NewSection = { type: SectionType; content: SectionContent };

/** Monta as seções iniciais do guia a partir do rascunho revisado. */
export function buildSectionsFromDraft(draft: ListingDraft): NewSection[] {
  const photosByRoom = new Map<string, string[]>();
  for (const photo of draft.photos) {
    const room = photo.room || "Outros";
    photosByRoom.set(room, [...(photosByRoom.get(room) ?? []), photo.url]);
  }

  const roomNames = [
    ...draft.rooms.map((room) => room.name),
    ...[...photosByRoom.keys()].filter((name) => !draft.rooms.some((room) => room.name === name)),
  ];

  const sections: Partial<Record<SectionType, SectionContent>> = {
    host: parseSectionContent("host", {
      name: draft.hostName,
      title: "Anfitrião",
      bio: draft.hostBio,
      photoUrl: draft.hostPhotoUrl,
    }),
    amenities: parseSectionContent("amenities", { items: draft.amenities }),
    rules: parseSectionContent("rules", { rules: draft.rules.map((text) => ({ text })) }),
    about: parseSectionContent("about", {
      guests: draft.guests,
      bedrooms: draft.bedrooms,
      beds: draft.beds,
      bathrooms: draft.bathrooms,
      description: draft.description,
      features: draft.features,
    }),
    rooms: parseSectionContent("rooms", {
      rooms: roomNames.map((name) => ({
        name,
        description: draft.rooms.find((room) => room.name === name)?.description ?? "",
        photos: photosByRoom.get(name) ?? [],
      })),
    }),
    wifi: sectionMeta.wifi.defaultContent(),
    emergency: sectionMeta.emergency.defaultContent(),
    checkin: parseSectionContent("checkin", {
      checkInTime: draft.checkInTime,
      checkOutTime: draft.checkOutTime,
      checkInInstructions: draft.checkInInstructions,
    }),
    local_tips: sectionMeta.local_tips.defaultContent(),
    restaurants: sectionMeta.restaurants.defaultContent(),
    feedback: parseSectionContent("feedback", {
      ...sectionMeta.feedback.defaultContent(),
      airbnbUrl: draft.sourceUrl && /airbnb\./i.test(draft.sourceUrl) ? draft.sourceUrl : "",
      bookingUrl: draft.sourceUrl && /booking\.com/i.test(draft.sourceUrl) ? draft.sourceUrl : "",
    }),
  };

  const result: NewSection[] = defaultSectionOrder.map((type) => ({
    type,
    content: sections[type] ?? sectionMeta[type].defaultContent(),
  }));

  if (draft.safety.length > 0) {
    result.push({
      type: "safety",
      content: parseSectionContent("safety", {
        items: draft.safety.map((title) => ({ title, text: "" })),
      }),
    });
  }

  return result;
}
