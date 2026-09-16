import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireOwnedProperty } from "@/lib/api";
import { cleanupUnusedUploads } from "@/lib/guide/uploads";
import { uploadPropertyImage } from "@/lib/storage";
import { readImageUpload } from "@/lib/upload-request";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const upload = await readImageUpload(request);
  if (upload.error) return upload.error;

  const url = await uploadPropertyImage(id, "cover", upload.buffer, upload.file.type);

  const updated = await prisma.property.update({
    where: { id },
    data: { coverImageUrl: url },
  });

  if (owned.property.coverImageUrl) {
    await cleanupUnusedUploads(id, [owned.property.coverImageUrl]);
  }

  return NextResponse.json({ property: updated });
}
