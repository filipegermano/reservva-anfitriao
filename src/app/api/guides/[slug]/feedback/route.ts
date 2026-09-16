import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/api";
import { parseSectionContent } from "@/lib/guide/sections";
import { guestFeedbackSchema } from "@/lib/validations/property";

type RouteParams = { params: Promise<{ slug: string }> };

/** Avaliação enviada pelo hóspede na seção "Avaliação" de um guia publicado. */
export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const property = await prisma.property.findUnique({
    where: { slug },
    select: {
      id: true,
      published: true,
      sections: { where: { type: "feedback", enabled: true }, select: { content: true } },
    },
  });

  const section = property?.sections[0];
  const settings = section ? parseSectionContent("feedback", section.content) : null;
  if (!property?.published || !settings?.showRating) {
    return NextResponse.json({ error: "Guia não encontrado" }, { status: 404 });
  }

  const { data, error } = await parseJsonBody(request, guestFeedbackSchema);
  if (error) return error;

  await prisma.guestFeedback.create({
    data: {
      propertyId: property.id,
      rating: data.rating,
      comment: settings.allowComments ? data.comment : undefined,
      guestName: data.guestName,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
