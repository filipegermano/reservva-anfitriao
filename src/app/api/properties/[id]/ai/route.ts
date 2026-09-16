import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { parseJsonBody, requireOwnedProperty } from "@/lib/api";
import { aiTasks, generateGuideText, isAiEnabled } from "@/lib/ai";
import { guideInclude, toGuideData, type GuideData } from "@/lib/guide/data";

type RouteParams = { params: Promise<{ id: string }> };

const aiRequestSchema = z.object({ task: z.enum(aiTasks) });

/** Resume o guia em texto para dar contexto à IA. */
function describeGuide({ property, sections }: GuideData): string {
  const lines: (string | false | null | undefined)[] = [
    `Nome: ${property.name}`,
    property.propertyType && `Tipo: ${property.propertyType}`,
    property.city && `Cidade: ${property.city}`,
    property.address && `Endereço: ${property.address}`,
    property.shortDescription && `Descrição curta: ${property.shortDescription}`,
  ];

  for (const section of sections) {
    switch (section.type) {
      case "about": {
        const { content } = section;
        lines.push(
          `Capacidade: ${content.guests} hóspedes, ${content.bedrooms} quartos, ${content.beds} camas, ${content.bathrooms} banheiros`,
          content.description && `Descrição: ${content.description}`,
          content.features.length > 0 && `Diferenciais: ${content.features.join("; ")}`,
        );
        break;
      }
      case "amenities":
        if (section.content.items.length > 0) {
          lines.push(`Comodidades: ${section.content.items.join(", ")}`);
        }
        break;
      case "rules":
        if (section.content.rules.length > 0) {
          lines.push(`Regras atuais:\n${section.content.rules.map((rule) => `- ${rule.text}`).join("\n")}`);
        }
        break;
      case "host":
        lines.push(
          section.content.name && `Anfitrião: ${section.content.name}`,
          section.content.bio && `Apresentação atual do anfitrião: ${section.content.bio}`,
        );
        break;
      case "checkin":
        lines.push(
          section.content.checkInTime && `Check-in: ${section.content.checkInTime}`,
          section.content.checkOutTime && `Check-out: ${section.content.checkOutTime}`,
        );
        break;
      case "rooms":
        if (section.content.rooms.length > 0) {
          lines.push(`Ambientes: ${section.content.rooms.map((room) => room.name).join(", ")}`);
        }
        break;
    }
  }

  return lines.filter(Boolean).join("\n");
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  if (!isAiEnabled()) {
    return NextResponse.json({ error: "Recursos de IA não configurados" }, { status: 503 });
  }

  const { data, error } = await parseJsonBody(request, aiRequestSchema);
  if (error) return error;

  const property = await prisma.property.findUniqueOrThrow({
    where: { id },
    include: guideInclude,
  });

  try {
    const result = await generateGuideText(data.task, describeGuide(toGuideData(property)));
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[ai]", err);
    return NextResponse.json(
      { error: "Não foi possível gerar o texto agora. Tente novamente." },
      { status: 502 },
    );
  }
}
