import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { appOrigin, guideUrl, requireOwnedProperty } from "@/lib/api";
import { guideInclude, toGuideData } from "@/lib/guide/data";
import { posterContent, posterOptionsSchema, posterTemplates } from "@/lib/poster";
import { PosterDocument } from "@/components/pdf/poster-document";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const searchParams = new URL(request.url).searchParams;
  const options = posterOptionsSchema.parse(Object.fromEntries(searchParams));
  const template = posterTemplates.find((item) => item.id === options.template)!;

  const property = await prisma.property.findUniqueOrThrow({
    where: { id },
    include: guideInclude,
  });

  const url = guideUrl(appOrigin(request), property.slug);
  const qrCodeDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 800 });

  const buffer = await renderToBuffer(
    <PosterDocument
      content={posterContent(toGuideData(property))}
      template={template}
      size={options.size}
      lang={options.lang}
      showWifi={options.showWifi}
      showRules={options.showRules}
      guideUrl={url}
      qrCodeDataUrl={qrCodeDataUrl}
    />,
  );

  const filename = `cartaz-${property.slug}-${options.size.toLowerCase()}.pdf`;
  const disposition = searchParams.has("download") ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
