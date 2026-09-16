import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseJsonBody, requireOwnedProperty } from "@/lib/api";
import { toSectionData } from "@/lib/guide/data";
import { isSectionType, validateSectionContent } from "@/lib/guide/sections";
import { cleanupUnusedUploads, removedUploads } from "@/lib/guide/uploads";
import { updateSectionSchema } from "@/lib/validations/property";

type RouteParams = { params: Promise<{ id: string; sectionId: string }> };

async function findSection(propertyId: string, sectionId: string) {
  const section = await prisma.guideSection.findUnique({ where: { id: sectionId } });
  return section && section.propertyId === propertyId ? section : null;
}

const notFound = () => NextResponse.json({ error: "Seção não encontrada" }, { status: 404 });

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, sectionId } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const section = await findSection(id, sectionId);
  if (!section || !isSectionType(section.type)) return notFound();

  const { data, error } = await parseJsonBody(request, updateSectionSchema);
  if (error) return error;

  let content: object | undefined;
  if (data.content !== undefined) {
    const parsed = validateSectionContent(section.type, data.content);
    if (!parsed.success) {
      return NextResponse.json({ error: "Conteúdo da seção inválido" }, { status: 400 });
    }
    content = parsed.data;
  }

  const updated = await prisma.guideSection.update({
    where: { id: sectionId },
    data: { title: data.title, enabled: data.enabled, content },
  });

  if (content) {
    await cleanupUnusedUploads(id, removedUploads(section.content, content));
  }

  return NextResponse.json({ section: toSectionData(updated) });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, sectionId } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const section = await findSection(id, sectionId);
  if (!section) return notFound();

  await prisma.guideSection.delete({ where: { id: sectionId } });
  await cleanupUnusedUploads(id, removedUploads(section.content, null));

  return NextResponse.json({ ok: true });
}
