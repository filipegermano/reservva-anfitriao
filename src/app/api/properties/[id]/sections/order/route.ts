import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseJsonBody, requireOwnedProperty } from "@/lib/api";
import { reorderSectionsSchema } from "@/lib/validations/property";

type RouteParams = { params: Promise<{ id: string }> };

/** Recebe a nova ordem completa das seções do guia. */
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const { data, error } = await parseJsonBody(request, reorderSectionsSchema);
  if (error) return error;

  const sections = await prisma.guideSection.findMany({
    where: { propertyId: id },
    select: { id: true },
  });
  const known = new Set(sections.map((section) => section.id));
  if (data.ids.length !== known.size || data.ids.some((sectionId) => !known.has(sectionId))) {
    return NextResponse.json({ error: "Lista de seções desatualizada" }, { status: 409 });
  }

  await prisma.$transaction(
    data.ids.map((sectionId, order) =>
      prisma.guideSection.update({ where: { id: sectionId }, data: { order } }),
    ),
  );

  return NextResponse.json({ ok: true });
}
