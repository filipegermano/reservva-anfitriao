import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DoorOpen, LogOut, MapPin, ScrollText, Wifi } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { recommendationCategoryLabels } from "@/lib/recommendation-categories";
import { CopyField } from "@/components/copy-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        className="flex h-48 flex-col items-center justify-end bg-gradient-to-br from-primary/80 to-primary bg-cover bg-center px-4 pb-6 text-center text-primary-foreground"
        style={
          property.coverImageUrl
            ? { backgroundImage: `url(${property.coverImageUrl})` }
            : undefined
        }
      >
        <div className="rounded-lg bg-background/90 px-4 py-2 text-foreground shadow-sm">
          <h1 className="text-xl font-semibold">{property.name}</h1>
          {property.address && (
            <p className="text-sm text-muted-foreground">{property.address}</p>
          )}
        </div>
      </div>

      <div className="mx-auto -mt-2 max-w-xl space-y-4 px-4">
        {property.welcomeMessage && (
          <Card>
            <CardContent className="py-4 text-sm leading-relaxed">
              {property.welcomeMessage}
            </CardContent>
          </Card>
        )}

        {(property.wifiName || property.wifiPassword) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wifi className="size-4 text-primary" />
                Wi-Fi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {property.wifiName && <CopyField label="Rede" value={property.wifiName} />}
              {property.wifiPassword && (
                <CopyField label="Senha" value={property.wifiPassword} />
              )}
            </CardContent>
          </Card>
        )}

        {(property.checkInTime || property.checkInInstructions) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DoorOpen className="size-4 text-primary" />
                Check-in
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
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
            </CardContent>
          </Card>
        )}

        {(property.checkOutTime || property.checkOutInstructions) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <LogOut className="size-4 text-primary" />
                Check-out
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
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
            </CardContent>
          </Card>
        )}

        {property.houseRules && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ScrollText className="size-4 text-primary" />
                Regras da casa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {property.houseRules}
              </p>
            </CardContent>
          </Card>
        )}

        {property.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-primary" />
                Dicas da região
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {Object.entries(recommendationsByCategory).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <Badge variant="secondary">
                    {recommendationCategoryLabels[
                      category as keyof typeof recommendationCategoryLabels
                    ] ?? category}
                  </Badge>
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={item.id} className="text-sm">
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-muted-foreground">{item.description}</p>
                        )}
                        {item.mapsUrl && (
                          <a
                            href={item.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline underline-offset-4"
                          >
                            Ver no mapa
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="pt-4 text-center text-xs text-muted-foreground">
          Guia criado com{" "}
          <Link href="/" className="underline underline-offset-4">
            Reservva Anfitrião
          </Link>
        </p>
      </div>
    </div>
  );
}
