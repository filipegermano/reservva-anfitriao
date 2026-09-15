import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DoorOpen, LogOut, MapPin, MessageCircleHeart, ScrollText, Wifi } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { recommendationCategoryIcons, recommendationCategoryLabels } from "@/lib/recommendation-categories";
import { CopyField } from "@/components/copy-field";

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

function SectionCard({
  icon: Icon,
  title,
  tone,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tone: "primary" | "accent";
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-center gap-2.5">
        <div
          className={
            tone === "accent"
              ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground"
              : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          }
        >
          <Icon className="size-4" />
        </div>
        <p className="font-heading font-medium">{title}</p>
      </div>
      <div className="mt-3 space-y-2 text-sm">{children}</div>
    </div>
  );
}

export default async function GuestGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) notFound();

  const recommendationsByCategory = property.recommendations.reduce<
    Record<string, typeof property.recommendations>
  >((acc, recommendation) => {
    const key = recommendation.category;
    acc[key] = acc[key] ? [...acc[key], recommendation] : [recommendation];
    return acc;
  }, {});

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

          {(property.wifiName || property.wifiPassword) && (
            <SectionCard icon={Wifi} title="Wi-Fi" tone="primary">
              {property.wifiName && <CopyField label="Rede" value={property.wifiName} />}
              {property.wifiPassword && (
                <CopyField label="Senha" value={property.wifiPassword} />
              )}
            </SectionCard>
          )}

          {(property.checkInTime || property.checkInInstructions) && (
            <SectionCard icon={DoorOpen} title="Check-in" tone="accent">
              {property.checkInTime && (
                <p>
                  <span className="font-medium">Horário:</span> {property.checkInTime}
                </p>
              )}
              {property.checkInInstructions && (
                <p className="whitespace-pre-line text-muted-foreground">
                  {property.checkInInstructions}
                </p>
              )}
            </SectionCard>
          )}

          {(property.checkOutTime || property.checkOutInstructions) && (
            <SectionCard icon={LogOut} title="Check-out" tone="primary">
              {property.checkOutTime && (
                <p>
                  <span className="font-medium">Horário:</span> {property.checkOutTime}
                </p>
              )}
              {property.checkOutInstructions && (
                <p className="whitespace-pre-line text-muted-foreground">
                  {property.checkOutInstructions}
                </p>
              )}
            </SectionCard>
          )}

          {property.houseRules && (
            <SectionCard icon={ScrollText} title="Regras da casa" tone="accent">
              <p className="whitespace-pre-line text-muted-foreground">{property.houseRules}</p>
            </SectionCard>
          )}

          {property.recommendations.length > 0 && (
            <SectionCard icon={MapPin} title="Dicas da região" tone="primary">
              <div className="space-y-5">
                {Object.entries(recommendationsByCategory).map(([category, items]) => {
                  const CategoryIcon =
                    recommendationCategoryIcons[
                      category as keyof typeof recommendationCategoryIcons
                    ] ?? MapPin;

                  return (
                    <div key={category}>
                      <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        <CategoryIcon className="size-3.5" />
                        {recommendationCategoryLabels[
                          category as keyof typeof recommendationCategoryLabels
                        ] ?? category}
                      </p>
                      <ul className="mt-2 space-y-3">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="rounded-lg bg-accent/30 p-2.5"
                          >
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-muted-foreground">{item.description}</p>
                            )}
                            {item.mapsUrl && (
                              <a
                                href={item.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-block text-primary underline underline-offset-4"
                              >
                                Ver no mapa
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

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
