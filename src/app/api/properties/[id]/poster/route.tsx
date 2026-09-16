import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";

import { prisma } from "@/lib/prisma";
import { appOrigin, guideUrl, requireOwnedProperty } from "@/lib/api";
import { guideInclude, toGuideData } from "@/lib/guide/data";
import { posterContent, posterOptionsSchema, posterTemplates } from "@/lib/poster";
import { applyTranslation } from "@/lib/guide/translation";
import { loadPosterImage } from "@/lib/poster-image";
import { PosterDocument, posterDensityLevels } from "@/components/pdf/poster-document";

type RouteParams = { params: Promise<{ id: string }> };

function countPdfPages(pdf: Buffer): number {
  return pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g)?.length ?? 0;
}

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
  const [qrCodeDataUrl, coverImage] = await Promise.all([
    QRCode.toDataURL(url, { margin: 1, width: 800 }),
    options.showImage ? loadPosterImage(property.coverImageUrl) : null,
  ]);

  // Em inglês/espanhol usa a tradução do guia, se houver. Sem tradução, os
  // textos do anfitrião ficam em português e a mensagem de boas-vindas sai.
  const guide = toGuideData(property);
  const translated = options.lang !== "pt" && Boolean(guide.translations[options.lang]);
  const content = posterContent(applyTranslation(guide, options.lang));
  if (options.lang !== "pt" && !translated) content.welcomeMessage = "";

  // Vai compactando até o cartaz caber em uma única página.
  let buffer: Buffer | null = null;
  for (let density = 0; density < posterDensityLevels.length; density += 1) {
    buffer = await renderToBuffer(
      <PosterDocument
        content={content}
        template={template}
        size={options.size}
        lang={options.lang}
        showWifi={options.showWifi}
        showRules={options.showRules}
        showContact={options.showContact}
        guideUrl={url}
        qrCodeDataUrl={qrCodeDataUrl}
        coverImage={coverImage}
        density={density}
      />,
    );
    if (countPdfPages(buffer) <= 1) break;
  }

  const filename = `cartaz-${property.slug}-${options.size.toLowerCase()}.pdf`;
  const disposition = searchParams.has("download") ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(buffer!), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
