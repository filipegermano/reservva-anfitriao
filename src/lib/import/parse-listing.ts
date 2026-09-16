import {
  defaultWelcomeMessage,
  firstSentence,
  listingDraftSchema,
  type ListingDraft,
} from "@/lib/import/listing-draft";

type Json = unknown;
type JsonObject = Record<string, Json>;

function isObject(value: Json): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: Json): Json[] {
  return Array.isArray(value) ? value : [];
}

function str(value: Json): string {
  return typeof value === "string" ? value : "";
}

function get(value: Json, ...path: (string | number)[]): Json {
  let current: Json = value;
  for (const key of path) {
    if (Array.isArray(current) && typeof key === "number") current = current[key];
    else if (isObject(current) && typeof key === "string") current = current[key];
    else return undefined;
  }
  return current;
}

const entities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X")) {
      return String.fromCodePoint(parseInt(code.slice(2), 16));
    }
    if (code.startsWith("#")) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return entities[code.toLowerCase()] ?? match;
  });
}

/** Converte um trecho de HTML em texto simples, preservando quebras de linha. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t\f\r]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function metaContent(html: string, property: string): string {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const reversed = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "i",
  );
  const match = html.match(pattern) ?? html.match(reversed);
  return match ? decodeEntities(match[1]).trim() : "";
}

function jsonLdBlocks(html: string): JsonObject[] {
  const blocks: JsonObject[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      const parsed: Json = JSON.parse(match[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (!isObject(item)) continue;
        blocks.push(item);
        for (const nested of asArray(item["@graph"])) {
          if (isObject(nested)) blocks.push(nested);
        }
      }
    } catch {
      // JSON-LD inválido: ignora o bloco
    }
  }
  return blocks;
}

const lodgingTypes = [
  "VacationRental",
  "LodgingBusiness",
  "Hotel",
  "Accommodation",
  "Apartment",
  "House",
  "Resort",
  "BedAndBreakfast",
  "Hostel",
  "Product",
];

function findLodging(blocks: JsonObject[]): JsonObject | undefined {
  return blocks.find((block) => {
    const types = asArray(block["@type"]).concat(block["@type"]);
    return types.some((type) => lodgingTypes.includes(str(type)));
  });
}

function imageUrls(value: Json): string[] {
  if (typeof value === "string") return [value];
  return asArray(value)
    .map((item) => (typeof item === "string" ? item : str(get(item, "url"))))
    .filter(Boolean);
}

const typeMap: [RegExp, ListingDraft["propertyType"]][] = [
  [/apart|apto|flat|condo/i, "Apartamento"],
  [/studio|est[úu]dio|kitnet/i, "Studio"],
  [/loft/i, "Loft"],
  [/chal[ée]|cabin|cabana/i, "Chalé"],
  [/s[íi]tio|ch[áa]cara|fazenda|farm/i, "Sítio"],
  [/pousada|inn|guest ?house|bed and breakfast/i, "Pousada"],
  [/hotel|hostel|resort/i, "Hotel"],
  [/casa|house|home|villa|townhouse/i, "Casa"],
];

export function mapPropertyType(...hints: string[]): ListingDraft["propertyType"] {
  for (const hint of hints) {
    if (!hint) continue;
    const found = typeMap.find(([pattern]) => pattern.test(hint));
    if (found) return found[1];
  }
  return "Apartamento";
}

/** "4 hóspedes · 1 quarto · 2 camas · 1 banheiro" → contagens. */
export function parseCapacity(items: string[]) {
  const result = { guests: 0, bedrooms: 0, beds: 0, bathrooms: 0 };
  for (const item of items) {
    const value = Number.parseFloat((item.match(/\d+(?:[.,]\d+)?/)?.[0] ?? "").replace(",", "."));
    if (Number.isNaN(value)) continue;
    const amount = Math.round(value);
    if (/h[óo]spede|guest/i.test(item)) result.guests = amount;
    else if (/quarto|bedroom/i.test(item)) result.bedrooms = amount;
    else if (/banheiro|bath/i.test(item)) result.bathrooms = amount;
    else if (/cama|bed/i.test(item)) result.beds = amount;
  }
  return result;
}

function extractTime(value: string): string {
  const match = value.match(/(\d{1,2})[:h](\d{2})?/i);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2] ?? "00"}`;
}

function ugcText(value: Json): string {
  return (
    str(get(value, "localizedStringWithTranslationPreference")) ||
    str(get(value, "localizedString")) ||
    str(get(value, "source")) ||
    str(get(value, "content", "localizedStringWithTranslationPreference")) ||
    str(get(value, "content", "localizedString"))
  );
}

function findPdpNode(state: Json): JsonObject | undefined {
  const stack: Json[] = [state];
  let steps = 0;
  while (stack.length > 0 && steps < 200_000) {
    steps += 1;
    const current = stack.pop();
    if (Array.isArray(current)) {
      stack.push(...current);
    } else if (isObject(current)) {
      if (isObject(current.pdpPresentation)) return current;
      stack.push(...Object.values(current));
    }
  }
  return undefined;
}

function deferredStates(html: string): Json[] {
  const states: Json[] = [];
  const pattern = /<script[^>]+id=["']data-deferred-state-\d+["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      states.push(JSON.parse(match[1]));
    } catch {
      // estado inválido: ignora
    }
  }
  return states;
}

const skippedRuleTypes = new Set([
  "HOUSE_RULES_CHECK_IN_WINDOW",
  "HOUSE_RULES_CHECK_OUT_TIME",
  "HOUSE_RULES_SELF_CHECK_IN_OPTIONS",
]);

/** Extrai o rascunho de um anúncio do Airbnb a partir do HTML da página. */
export function parseAirbnbHtml(html: string, sourceUrl: string | null): ListingDraft | null {
  const node = deferredStates(html).map(findPdpNode).find(Boolean);
  if (!node) return null;

  const pdp = node.pdpPresentation as JsonObject;
  const lodging = findLodging(jsonLdBlocks(html));

  const name = (
    ugcText(get(pdp, "title", "content")) ||
    str(lodging?.name) ||
    metaContent(html, "og:description")
  )
    .trim()
    .slice(0, 120);

  const descriptionHtml = ugcText(get(pdp, "descriptions", "longDescriptionHtml"));
  const description = descriptionHtml ? htmlToText(descriptionHtml) : str(lodging?.description);

  const locationSubtitle = str(get(pdp, "location", "subtitle"));
  const cityParts = locationSubtitle.split(",").map((part) => part.trim());
  const city = cityParts.slice(0, 2).join(", ") || str(get(lodging, "address", "addressLocality"));

  const latitude = get(pdp, "location", "latitude") ?? get(lodging, "latitude");
  const longitude = get(pdp, "location", "longitude") ?? get(lodging, "longitude");

  const overviewItems = asArray(get(pdp, "overview", "items")).map(str);
  const capacity = parseCapacity(overviewItems);
  if (!capacity.guests && typeof node.personCapacity === "number") {
    capacity.guests = node.personCapacity;
  }

  const amenities: string[] = [];
  for (const group of asArray(get(pdp, "amenities", "seeAllAmenitiesGroups"))) {
    for (const amenity of asArray(get(group, "amenities"))) {
      if (get(amenity, "available") === false) continue;
      const title = str(get(amenity, "title")).trim();
      if (title && !amenities.includes(title)) amenities.push(title);
    }
  }

  let checkInTime = "";
  let checkOutTime = "";
  const checkInNotes: string[] = [];
  const rules: string[] = [];
  for (const group of asArray(get(pdp, "rules", "groupItems"))) {
    for (const item of asArray(get(group, "items"))) {
      const type = str(get(item, "type"));
      const title = str(get(item, "title")).trim();
      const detail = str(get(item, "description", "text")).trim();
      if (!title) continue;
      if (type === "HOUSE_RULES_CHECK_IN_WINDOW") checkInTime = extractTime(title);
      else if (type === "HOUSE_RULES_CHECK_OUT_TIME") checkOutTime = extractTime(title);
      else if (type === "HOUSE_RULES_SELF_CHECK_IN_OPTIONS") checkInNotes.push(title);
      if (skippedRuleTypes.has(type)) continue;
      rules.push(detail ? `${title}: ${detail}` : title);
    }
  }

  const safety: string[] = [];
  for (const group of asArray(get(pdp, "safetyAndProperty", "groupItems"))) {
    for (const item of asArray(get(group, "items"))) {
      const title = str(get(item, "title")).trim();
      if (title) safety.push(title);
    }
  }

  const photos: ListingDraft["photos"] = [];
  const rooms: ListingDraft["rooms"] = [];
  const seen = new Set<string>();
  for (const stop of asArray(get(pdp, "mediaTour", "stops"))) {
    const room = str(get(stop, "name")).trim();
    const details = asArray(get(stop, "description", "descriptions"))
      .map((entry) => str(get(entry, "text")).trim())
      .filter(Boolean);
    if (room && !rooms.some((existing) => existing.name === room)) {
      rooms.push({ name: room, description: details.join(" · ") });
    }
    for (const item of asArray(get(stop, "items"))) {
      const url = str(get(item, "image", "uri"));
      if (url && !seen.has(url)) {
        seen.add(url);
        photos.push({ url, room });
      }
    }
  }
  for (const url of imageUrls(lodging?.image)) {
    if (!seen.has(url)) {
      seen.add(url);
      photos.push({ url, room: "" });
    }
  }

  const heroUrl = str(get(pdp, "heroMedia", "edges", 0, "node", "image", "uri"));
  if (heroUrl) {
    const index = photos.findIndex((photo) => photo.url === heroUrl);
    if (index > 0) photos.unshift(...photos.splice(index, 1));
    if (index < 0) photos.unshift({ url: heroUrl, room: "" });
  }

  const passport = get(pdp, "hostInfo", "passportData");
  const hostBio =
    ugcText(get(pdp, "hostInfo", "about")) ||
    asArray(get(pdp, "hostInfo", "highlights"))
      .map((highlight) => str(get(highlight, "text", "text")))
      .filter(Boolean)
      .join(". ");

  const overviewTitle = str(get(pdp, "overview", "title"));

  return listingDraftSchema.parse({
    sourceUrl,
    name: name || "Meu imóvel",
    propertyType: mapPropertyType(overviewTitle, str(node.propertyType), name),
    address: locationSubtitle,
    city,
    hostName: str(get(passport, "name")),
    hostPhotoUrl: str(get(passport, "profilePictureUrl")),
    hostBio,
    description,
    shortDescription: firstSentence(description),
    welcomeMessage: defaultWelcomeMessage(name || "nosso espaço"),
    ...capacity,
    amenities,
    features: [],
    rules,
    safety,
    checkInTime,
    checkOutTime,
    checkInInstructions: checkInNotes.join("\n"),
    latitude: typeof latitude === "number" ? latitude : null,
    longitude: typeof longitude === "number" ? longitude : null,
    photos,
    rooms,
  });
}

/**
 * Extração genérica (Booking, sites próprios...) via JSON-LD e Open Graph.
 * Traz o básico; o restante pode ser completado com IA ou manualmente.
 */
export function parseGenericHtml(html: string, sourceUrl: string | null): ListingDraft {
  const lodging = findLodging(jsonLdBlocks(html));
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const name = decodeEntities(
    str(lodging?.name) || metaContent(html, "og:title") || title,
  ).trim();
  const description =
    htmlToText(str(lodging?.description)) ||
    metaContent(html, "og:description") ||
    metaContent(html, "description");

  const photos = [...imageUrls(lodging?.image), metaContent(html, "og:image")]
    .filter((url, index, all) => /^https?:\/\//.test(url) && all.indexOf(url) === index)
    .map((url) => ({ url, room: "" }));

  const address = get(lodging, "address");
  const city = [str(get(address, "addressLocality")), str(get(address, "addressRegion"))]
    .filter(Boolean)
    .join(", ");
  const street = typeof address === "string" ? address : str(get(address, "streetAddress"));

  const latitude = Number(get(lodging, "geo", "latitude") ?? get(lodging, "latitude"));
  const longitude = Number(get(lodging, "geo", "longitude") ?? get(lodging, "longitude"));

  const safeName = (name || "Meu imóvel").slice(0, 120);

  return listingDraftSchema.parse({
    sourceUrl,
    name: safeName.length >= 2 ? safeName : "Meu imóvel",
    propertyType: mapPropertyType(name, str(lodging?.["@type"]), description),
    address: [street, city].filter(Boolean).join(", "),
    city,
    description,
    shortDescription: firstSentence(description),
    welcomeMessage: defaultWelcomeMessage(safeName),
    guests: Number(get(lodging, "containsPlace", "occupancy", "value")) || 0,
    amenities: asArray(get(lodging, "amenityFeature"))
      .map((feature) => str(get(feature, "name")))
      .filter(Boolean),
    latitude: Number.isFinite(latitude) && latitude !== 0 ? latitude : null,
    longitude: Number.isFinite(longitude) && longitude !== 0 ? longitude : null,
    photos,
  });
}

export function isAirbnbUrl(url: string): boolean {
  try {
    return /(^|\.)airbnb\.[a-z.]+$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function parseListingHtml(html: string, sourceUrl: string | null): ListingDraft {
  return parseAirbnbHtml(html, sourceUrl) ?? parseGenericHtml(html, sourceUrl);
}
