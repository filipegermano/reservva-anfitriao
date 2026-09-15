import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedProperty } from "@/lib/property-access";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, s3, uploadsBucket } from "@/lib/storage";

type RouteParams = { params: Promise<{ id: string }> };

const UPLOAD_PREFIX = "/api/uploads/";

function keyFromUploadUrl(url: string | null): string | null {
  if (!url || !url.startsWith(UPLOAD_PREFIX)) return null;
  return url.slice(UPLOAD_PREFIX.length);
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const property = await getOwnedProperty(id, session.user.id);
  if (!property) {
    return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }

  const extension = ALLOWED_IMAGE_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Formato não suportado. Envie JPG, PNG ou WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Tamanho máximo: 5MB." },
      { status: 400 },
    );
  }

  const key = `properties/${id}/cover-${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: uploadsBucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  const previousKey = keyFromUploadUrl(property.coverImageUrl);

  const updated = await prisma.property.update({
    where: { id },
    data: { coverImageUrl: `${UPLOAD_PREFIX}${key}` },
  });

  if (previousKey) {
    await s3
      .send(new DeleteObjectCommand({ Bucket: uploadsBucket, Key: previousKey }))
      .catch(() => null);
  }

  return NextResponse.json({ property: updated });
}
