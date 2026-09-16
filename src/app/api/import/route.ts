import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { parseJsonBody } from "@/lib/api";
import { extractListingWithAi, isAiEnabled } from "@/lib/ai";
import {
  defaultWelcomeMessage,
  firstSentence,
  listingDraftSchema,
  type ListingDraft,
} from "@/lib/import/listing-draft";
import { htmlToText, parseAirbnbHtml, parseGenericHtml } from "@/lib/import/parse-listing";
import { safeFetch, UnsafeUrlError } from "@/lib/import/safe-fetch";
import { importListingSchema } from "@/lib/validations/property";

const MAX_PAGE_BYTES = 8 * 1024 * 1024;
const MAX_AI_TEXT = 60_000;

/** Combina o que veio da página com o que a IA entendeu do texto. */
function mergeWithAi(base: ListingDraft, ai: Awaited<ReturnType<typeof extractListingWithAi>>) {
  const pick = <T,>(current: T, fallback: T) =>
    (Array.isArray(current) ? current.length > 0 : Boolean(current)) ? current : fallback;

  return listingDraftSchema.parse({
    ...base,
    name: base.name !== "Meu imóvel" ? base.name : ai.name || base.name,
    propertyType: ai.propertyType || base.propertyType,
    address: pick(base.address, ai.address),
    city: pick(base.city, ai.city),
    hostName: pick(base.hostName, ai.hostName),
    hostBio: pick(base.hostBio, ai.hostBio),
    description: pick(ai.description, base.description),
    shortDescription: pick(ai.shortDescription, base.shortDescription),
    welcomeMessage: pick(ai.welcomeMessage, base.welcomeMessage),
    guests: base.guests || ai.guests,
    bedrooms: base.bedrooms || ai.bedrooms,
    beds: base.beds || ai.beds,
    bathrooms: base.bathrooms || ai.bathrooms,
    amenities: pick(base.amenities, ai.amenities),
    features: pick(base.features, ai.features),
    rules: pick(base.rules, ai.rules),
    safety: pick(base.safety, ai.safety),
    checkInTime: pick(base.checkInTime, ai.checkInTime),
    checkOutTime: pick(base.checkOutTime, ai.checkOutTime),
    checkInInstructions: pick(base.checkInInstructions, ai.checkInInstructions),
    rooms: pick(base.rooms, ai.rooms),
  });
}

/**
 * Lê um anúncio (link ou texto colado) e devolve um rascunho de guia para o
 * anfitrião revisar. Nada é salvo aqui.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data, error } = await parseJsonBody(request, importListingSchema);
  if (error) return error;

  const aiEnabled = isAiEnabled();

  try {
    if ("text" in data) {
      if (!aiEnabled) {
        return NextResponse.json(
          { error: "Importar por texto precisa dos recursos de IA, que não estão configurados. Use o link do anúncio ou crie o guia manualmente." },
          { status: 422 },
        );
      }
      const ai = await extractListingWithAi(data.text);
      const draft = listingDraftSchema.parse({
        ...ai,
        sourceUrl: null,
        name: ai.name.trim().length >= 2 ? ai.name.slice(0, 120) : "Meu imóvel",
        shortDescription: ai.shortDescription || firstSentence(ai.description),
        welcomeMessage: ai.welcomeMessage || defaultWelcomeMessage(ai.name),
      });
      return NextResponse.json({ draft, usedAi: true });
    }

    const page = await safeFetch(data.url, {
      maxBytes: MAX_PAGE_BYTES,
      accept: "text/html,application/xhtml+xml",
    });
    if (!/html/i.test(page.contentType)) {
      return NextResponse.json({ error: "O link não aponta para uma página de anúncio" }, { status: 422 });
    }

    const html = page.body.toString("utf8");
    const airbnb = parseAirbnbHtml(html, data.url);
    if (airbnb) {
      return NextResponse.json({ draft: airbnb, usedAi: false });
    }

    const generic = parseGenericHtml(html, data.url);
    if (!aiEnabled) {
      return NextResponse.json({ draft: generic, usedAi: false, partial: true });
    }

    const pageText = htmlToText(html);
    if (pageText.length > MAX_AI_TEXT) {
      // Página grande demais para interpretar inteira: fica com os dados estruturados.
      return NextResponse.json({ draft: generic, usedAi: false, partial: true });
    }

    const ai = await extractListingWithAi(pageText);
    return NextResponse.json({ draft: mergeWithAi(generic, ai), usedAi: true });
  } catch (err) {
    const message =
      err instanceof UnsafeUrlError
        ? err.message
        : "Não conseguimos ler esse anúncio. Alguns sites bloqueiam a leitura automática — tente colar o texto do anúncio.";
    console.error("[import]", err);
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
