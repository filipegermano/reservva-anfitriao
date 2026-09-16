import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, MessageCircleHeart } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { GuestGuideSections } from "@/components/guide/guest-guide-sections";

type PageProps = { params: Promise<{ slug: string }> };

async function getProperty(slug: string) {
  return prisma.property.findUnique({
    where: { slug },
    include: { recommendations: { orderBy: { order: "asc" } } },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) return {};

  return {
    title: `Guia do hóspede — ${property.name}`,
    description: property.welcomeMessage ?? `Guia digital de ${property.name}`,
  };
}

export default async function GuestGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) notFound();

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      <div
        className="relative h-56 bg-gradient-to-br from-primary/80 to-primary bg-cover bg-center sm:h-64"
        style={
          property.coverImageUrl
            ? { backgroundImage: `url(${property.coverImageUrl})` }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto -mt-8 max-w-xl px-4">
        <div className="rounded-2xl border bg-card p-5 text-card-foreground shadow-lg">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Guia do hóspede
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold">{property.name}</h1>
          {property.address && (
            <p className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {property.address}
            </p>
          )}
        </div>

        <div className="mt-4 space-y-4">
          {property.welcomeMessage && (
            <div className="rounded-2xl bg-primary/10 p-4">
              <div className="flex gap-2.5">
                <MessageCircleHeart className="size-5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-foreground">
                  {property.welcomeMessage}
                </p>
              </div>
            </div>
          )}

          <GuestGuideSections property={property} />

          <p className="pt-4 text-center text-xs text-muted-foreground">
            Guia criado com{" "}
            <Link href="/" className="underline underline-offset-4">
              Reservva Anfitrião
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
