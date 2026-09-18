import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireSessionAccount } from "@/lib/account";
import { isAiEnabled } from "@/lib/ai";
import { configuredAppOrigin } from "@/lib/api";
import { guideInclude, toGuideData } from "@/lib/guide/data";
import { isStorageConfigured } from "@/lib/storage";
import { GuideEditor } from "@/components/editor/guide-editor";

type PageProps = { params: Promise<{ id: string }> };

async function publicOrigin(): Promise<string> {
  const configured = configuredAppOrigin();
  if (configured) return configured;
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export default async function PropertyPage({ params }: PageProps) {
  const { id } = await params;
  const account = await requireSessionAccount();

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      ...guideInclude,
      feedbacks: { orderBy: { createdAt: "desc" }, take: 100 },
    },
  });

  if (!property || property.accountId !== account.accountId) {
    notFound();
  }

  const origin = await publicOrigin();

  return (
    <GuideEditor
      initialGuide={toGuideData(property)}
      guideUrl={`${origin}/g/${property.slug}`}
      aiEnabled={isAiEnabled()}
      storageEnabled={isStorageConfigured()}
      feedbacks={property.feedbacks.map((feedback) => ({
        id: feedback.id,
        rating: feedback.rating,
        comment: feedback.comment,
        guestName: feedback.guestName,
        createdAt: feedback.createdAt.toISOString(),
      }))}
    />
  );
}
