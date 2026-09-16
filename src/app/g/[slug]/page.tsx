import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { guideInclude, toGuideData } from "@/lib/guide/data";
import { imageSrc } from "@/lib/guide/contacts";
import { getTheme } from "@/lib/guide/themes";
import { GuestGuide } from "@/components/guide/guest-guide";

type PageProps = { params: Promise<{ slug: string }> };

async function getProperty(slug: string) {
  return prisma.property.findUnique({ where: { slug }, include: guideInclude });
}

/** Rascunhos só aparecem para o próprio anfitrião (pré-visualização). */
async function canView(property: { published: boolean; userId: string }) {
  if (property.published) return true;
  const session = await auth();
  return session?.user?.id === property.userId;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property || !(await canView(property))) return {};

  const cover = imageSrc(property.coverImageUrl);
  const description =
    property.shortDescription ?? property.welcomeMessage ?? `Guia digital de ${property.name}`;

  return {
    title: `Guia do hóspede — ${property.name}`,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: property.name,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export async function generateViewport({ params }: PageProps): Promise<Viewport> {
  const { slug } = await params;
  const property = await prisma.property.findUnique({ where: { slug }, select: { theme: true } });
  return { themeColor: getTheme(property?.theme).primary };
}

export default async function GuestGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property || !(await canView(property))) notFound();

  if (property.published) {
    await prisma.property.update({
      where: { id: property.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  const guide = toGuideData(property);

  return (
    <div className="min-h-dvh" style={{ background: getTheme(property.theme).background }}>
      {!property.published && (
        <p className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Pré-visualização: este guia ainda não foi publicado e só você consegue vê-lo.
        </p>
      )}
      <div className="mx-auto min-h-dvh max-w-md shadow-xl">
        <GuestGuide guide={guide} />
      </div>
    </div>
  );
}
