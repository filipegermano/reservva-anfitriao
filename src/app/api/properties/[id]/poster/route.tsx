import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";

import { auth } from "@/auth";
import { getOwnedProperty } from "@/lib/property-access";
import { PosterDocument } from "@/components/pdf/poster-document";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const property = await getOwnedProperty(id, session.user.id);
  if (!property) {
    return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const guideUrl = `${origin}/g/${property.slug}`;

  const qrCodeDataUrl = await QRCode.toDataURL(guideUrl, { margin: 1, width: 600 });

  const buffer = await renderToBuffer(
    <PosterDocument property={property} guideUrl={guideUrl} qrCodeDataUrl={qrCodeDataUrl} />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cartaz-${property.slug}.pdf"`,
    },
  });
}
