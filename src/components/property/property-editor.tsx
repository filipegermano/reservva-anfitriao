"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

import type { Property, Recommendation } from "@/generated/prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PropertyGuideForm } from "@/components/property/property-guide-form";
import { RecommendationsManager } from "@/components/property/recommendations-manager";
import { PosterPanel } from "@/components/property/poster-panel";

type PropertyWithRecommendations = Property & { recommendations: Recommendation[] };

export function PropertyEditor({ property }: { property: PropertyWithRecommendations }) {
  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/app">
            <ArrowLeft className="size-4" />
            Meus imóveis
          </Link>
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{property.name}</h1>
          <Button asChild variant="outline" size="sm">
            <a href={`/g/${property.slug}`} target="_blank" rel="noopener noreferrer">
              Ver guia público
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="guia">
        <TabsList>
          <TabsTrigger value="guia">Guia digital</TabsTrigger>
          <TabsTrigger value="recomendacoes">Recomendações</TabsTrigger>
          <TabsTrigger value="cartaz">Cartaz &amp; QR code</TabsTrigger>
        </TabsList>

        <TabsContent value="guia" className="mt-6">
          <PropertyGuideForm property={property} />
        </TabsContent>

        <TabsContent value="recomendacoes" className="mt-6">
          <RecommendationsManager
            propertyId={property.id}
            initialRecommendations={property.recommendations}
          />
        </TabsContent>

        <TabsContent value="cartaz" className="mt-6">
          <PosterPanel property={property} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
