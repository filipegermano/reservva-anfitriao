"use client";

import { useState } from "react";
import { ArrowLeft, ChevronRight, DoorOpen, LogOut, MapPin, ScrollText, Wifi } from "lucide-react";

import type { Property, Recommendation } from "@/generated/prisma/client";
import { CopyField } from "@/components/copy-field";
import {
  recommendationCategoryIcons,
  recommendationCategoryLabels,
} from "@/lib/recommendation-categories";

type PropertyWithRecommendations = Property & { recommendations: Recommendation[] };

type Tone = "primary" | "accent";

type Section = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  title: string;
  preview: string;
  content: React.ReactNode;
};

function IconBadge({
  icon: Icon,
  tone,
  size = "md",
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  size?: "md" | "lg";
}) {
  const dimension = size === "lg" ? "size-11" : "size-9";
  const iconSize = size === "lg" ? "size-5" : "size-4";
  return (
    <div
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-xl ${
        tone === "accent" ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"
      }`}
    >
      <Icon className={iconSize} />
    </div>
  );
}

function buildSections(property: PropertyWithRecommendations): Section[] {
  const sections: Section[] = [];

  if (property.wifiName || property.wifiPassword) {
    sections.push({
      id: "wifi",
      icon: Wifi,
      tone: "primary",
      title: "Wi-Fi",
      preview: property.wifiName ?? "Ver rede e senha",
      content: (
        <div className="space-y-2">
          {property.wifiName && <CopyField label="Rede" value={property.wifiName} />}
          {property.wifiPassword && <CopyField label="Senha" value={property.wifiPassword} />}
        </div>
      ),
    });
  }

  if (property.checkInTime || property.checkInInstructions) {
    sections.push({
      id: "checkin",
      icon: DoorOpen,
      tone: "accent",
      title: "Check-in",
      preview: property.checkInTime ?? "Ver instruções",
      content: (
        <div className="space-y-2 text-sm">
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
        </div>
      ),
    });
  }

  if (property.checkOutTime || property.checkOutInstructions) {
    sections.push({
      id: "checkout",
      icon: LogOut,
      tone: "primary",
      title: "Check-out",
      preview: property.checkOutTime ?? "Ver instruções",
      content: (
        <div className="space-y-2 text-sm">
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
        </div>
      ),
    });
  }

  if (property.houseRules) {
    sections.push({
      id: "rules",
      icon: ScrollText,
      tone: "accent",
      title: "Regras da casa",
      preview: "Ver regras",
      content: (
        <p className="whitespace-pre-line text-sm text-muted-foreground">
          {property.houseRules}
        </p>
      ),
    });
  }

  if (property.recommendations.length > 0) {
    const grouped = property.recommendations.reduce<Record<string, Recommendation[]>>(
      (acc, recommendation) => {
        const key = recommendation.category;
        acc[key] = acc[key] ? [...acc[key], recommendation] : [recommendation];
        return acc;
      },
      {},
    );

    sections.push({
      id: "tips",
      icon: MapPin,
      tone: "primary",
      title: "Dicas da região",
      preview: `${property.recommendations.length} ${
        property.recommendations.length === 1 ? "dica" : "dicas"
      }`,
      content: (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, items]) => {
            const CategoryIcon =
              recommendationCategoryIcons[category as keyof typeof recommendationCategoryIcons] ??
              MapPin;

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
                    <li key={item.id} className="rounded-lg bg-accent/30 p-2.5 text-sm">
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
      ),
    });
  }

  return sections;
}

export function GuestGuideSections({ property }: { property: PropertyWithRecommendations }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const sections = buildSections(property);
  const openSection = sections.find((section) => section.id === openId);

  if (openSection) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpenId(null)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </button>

        <div className="mt-3 rounded-2xl border bg-card p-4 text-card-foreground shadow-sm">
          <div className="flex items-center gap-3">
            <IconBadge icon={openSection.icon} tone={openSection.tone} size="lg" />
            <p className="font-heading text-lg font-medium">{openSection.title}</p>
          </div>
          <div className="mt-4">{openSection.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => setOpenId(section.id)}
          className="flex flex-col items-start gap-2.5 rounded-2xl border bg-card p-4 text-left text-card-foreground shadow-sm transition hover:shadow-md active:scale-[0.98]"
        >
          <div className="flex w-full items-start justify-between">
            <IconBadge icon={section.icon} tone={section.tone} />
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="font-heading font-medium">{section.title}</p>
            <p className="truncate text-xs text-muted-foreground">{section.preview}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
