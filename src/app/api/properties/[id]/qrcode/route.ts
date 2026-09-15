import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const guideUrl = `${origin}/g/${property.slug}`;

  const buffer = await QRCode.toBuffer(guideUrl, {
    type: "png",
    width: 512,
    margin: 1,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
