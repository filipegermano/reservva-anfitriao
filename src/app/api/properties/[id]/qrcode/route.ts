import { NextResponse } from "next/server";
import QRCode from "qrcode";

import { appOrigin, guideUrl, requireOwnedProperty } from "@/lib/api";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const { slug } = owned.property;
  const buffer = await QRCode.toBuffer(guideUrl(appOrigin(request), slug), {
    type: "png",
    width: 1024,
    margin: 2,
  });

  const download = new URL(request.url).searchParams.has("download");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
      ...(download ? { "Content-Disposition": `attachment; filename="qrcode-${slug}.png"` } : {}),
    },
  });
}
