import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseJsonBody, requireOwnedProperty } from "@/lib/api";
import { toSectionData } from "@/lib/guide/data";
import { sectionMeta } from "@/lib/guide/sections";
import { createSectionSchema } from "@/lib/validations/property";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const { data, error } = await parseJsonBody(request, createSectionSchema);
  if (error) return error;

  const existing = await prisma.guideSection.findUnique({
    where: { propertyId_type: { propertyId: id, type: data.type } },
  });
  if (existing) {
    return NextResponse.json({ error: "Essa seção já está no guia" }, { status: 409 });
  }

  const last = await prisma.guideSection.aggregate({
    where: { propertyId: id },
    _max: { order: true },
  });

  const section = await prisma.guideSection.create({
    data: {
      propertyId: id,
      type: data.type,
      title: sectionMeta[data.type].label,
      order: (last._max.order ?? -1) + 1,
      content: sectionMeta[data.type].defaultContent(),
    },
  });

  return NextResponse.json({ section: toSectionData(section) }, { status: 201 });
}
