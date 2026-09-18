import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { ownerOnly, parseJsonBody, requireOwnedProperty } from "@/lib/api";
import { guideInclude, toGuideData } from "@/lib/guide/data";
import { cleanupUnusedUploads } from "@/lib/guide/uploads";
import { deletePropertyUploads, keyFromUploadUrl, propertyPrefix } from "@/lib/storage";
import { updatePropertySchema } from "@/lib/validations/property";

type RouteParams = { params: Promise<{ id: string }> };

/** A capa só pode ser um upload deste imóvel ou um link http(s) externo. */
function isUsableCover(propertyId: string, url: string): boolean {
  const key = keyFromUploadUrl(url);
  if (key) return key.startsWith(propertyPrefix(propertyId));
  return /^https:\/\//i.test(url);
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const property = await prisma.property.findUniqueOrThrow({
    where: { id },
    include: guideInclude,
  });

  return NextResponse.json({ guide: toGuideData(property) });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const { data, error } = await parseJsonBody(request, updatePropertySchema);
  if (error) return error;

  const { removeCover, published, coverImageUrl, ...fields } = data;

  if (coverImageUrl !== undefined && !isUsableCover(id, coverImageUrl)) {
    return NextResponse.json({ error: "Imagem de capa inválida" }, { status: 400 });
  }

  const property = await prisma.property.update({
    where: { id },
    data: {
      ...fields,
      ...(removeCover ? { coverImageUrl: null } : {}),
      ...(coverImageUrl ? { coverImageUrl } : {}),
      ...(published === undefined
        ? {}
        : {
            published,
            publishedAt: published ? (owned.property.publishedAt ?? new Date()) : null,
          }),
    },
  });

  const previousCover = owned.property.coverImageUrl;
  if ((removeCover || coverImageUrl) && previousCover && previousCover !== coverImageUrl) {
    await cleanupUnusedUploads(id, [previousCover]);
  }

  return NextResponse.json({ property });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const denied = ownerOnly(owned.account);
  if (denied) return denied;

  await prisma.property.delete({ where: { id } });
  await deletePropertyUploads(id).catch(() => null);

  return NextResponse.json({ ok: true });
}
