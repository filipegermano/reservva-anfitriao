"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Eye,
  Languages,
  Layers,
  Loader2,
  Monitor,
  Palette,
  Share2,
  Smartphone,
} from "lucide-react";

import type { GuideData } from "@/lib/guide/data";
import { availableLanguages, languageLabels, type GuideLanguage } from "@/lib/guide/translation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GuestGuide } from "@/components/guide/guest-guide";
import { EditorProvider } from "@/components/editor/editor-context";
import { SectionsPanel, type EditingTarget } from "@/components/editor/sections-panel";
import { SharePanel } from "@/components/editor/share-panel";
import { ThemePanel } from "@/components/editor/theme-panel";
import { LanguagesPanel } from "@/components/editor/languages-panel";
import type { ReceivedFeedback } from "@/components/editor/sections/feedback-editor";
import { useGuideEditor, type SaveState } from "@/components/editor/use-guide-editor";

type Tab = "sections" | "theme" | "languages" | "share" | "preview";

const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; mobileOnly?: boolean }[] = [
  { id: "sections", label: "Seções", icon: Layers },
  { id: "theme", label: "Tema", icon: Palette },
  { id: "languages", label: "Idiomas", icon: Languages },
  { id: "share", label: "Compartilhar", icon: Share2 },
  { id: "preview", label: "Prévia", icon: Eye, mobileOnly: true },
];

function SaveIndicator({ save }: { save: SaveState }) {
  if (save.status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" /> Salvando…
      </span>
    );
  }
  if (save.status === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <AlertCircle className="size-3.5" /> Erro ao salvar
      </span>
    );
  }
  if (save.status === "saved" && save.savedAt) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3.5" /> Salvo às{" "}
        {save.savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">Alterações são salvas automaticamente</span>;
}

function PhonePreview({
  guide,
  focusSection,
  device,
  language,
  onLanguageChange,
}: {
  guide: GuideData;
  focusSection: GuideData["sections"][number]["type"] | null;
  device: "phone" | "tablet";
  language: GuideLanguage;
  onLanguageChange: (language: GuideLanguage) => void;
}) {
  const languages = availableLanguages(guide);
  return (
    <div className="space-y-2">
      {languages.length > 1 && (
        <div className="flex justify-center gap-1">
          {languages.map((option) => (
            <Button
              key={option}
              type="button"
              size="xs"
              variant={option === language ? "secondary" : "ghost"}
              onClick={() => onLanguageChange(option)}
            >
              {languageLabels[option].flag} {languageLabels[option].short}
            </Button>
          ))}
        </div>
      )}
      <div
        className={cn(
          "mx-auto overflow-hidden border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl",
          device === "phone" ? "w-[340px] rounded-[2.5rem]" : "w-full max-w-[560px] rounded-[1.75rem]",
        )}
      >
        <div className="relative h-[680px] overflow-y-auto overscroll-contain rounded-[inherit] bg-white [&>*]:min-h-[680px]">
          <GuestGuide
            guide={guide}
            preview
            focusSection={focusSection}
            language={language}
            onLanguageChange={onLanguageChange}
          />
        </div>
      </div>
    </div>
  );
}

export function GuideEditor({
  initialGuide,
  guideUrl,
  aiEnabled,
  storageEnabled,
  feedbacks,
}: {
  initialGuide: GuideData;
  guideUrl: string;
  aiEnabled: boolean;
  storageEnabled: boolean;
  feedbacks: ReceivedFeedback[];
}) {
  const editor = useGuideEditor(initialGuide);
  const { guide, save } = editor;
  const [tab, setTab] = useState<Tab>("sections");
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [device, setDevice] = useState<"phone" | "tablet">("phone");
  const [previewLanguage, setPreviewLanguage] = useState<GuideLanguage>("pt");

  const focusSection =
    editing && editing !== "basic"
      ? (guide.sections.find((section) => section.id === editing)?.type ?? null)
      : null;

  return (
    <EditorProvider value={{ propertyId: guide.property.id, aiEnabled, storageEnabled, editor }}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="icon-sm" aria-label="Voltar para meus guias">
              <Link href="/app" onClick={() => void editor.flushAll()}>
                <ArrowLeft />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight">{guide.property.name}</h1>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    guide.property.published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
                  )}
                >
                  {guide.property.published ? "Publicado" : "Rascunho"}
                </span>
                <SaveIndicator save={save} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={guideUrl} target="_blank" rel="noopener noreferrer" onClick={() => void editor.flushAll()}>
                <Eye /> Ver guia
              </a>
            </Button>
            {!guide.property.published && (
              <Button size="sm" onClick={() => setTab("share")}>
                <Share2 /> Publicar
              </Button>
            )}
          </div>
        </div>

        {!storageEnabled && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Armazenamento de imagens não configurado: o envio de fotos vai falhar até definir as variáveis AWS_* do bucket.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_600px]">
          <div className="min-w-0 space-y-4">
            <nav className="flex gap-1 rounded-xl border bg-card p-1" aria-label="Seções do editor">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={tab === item.id ? "page" : undefined}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition",
                    tab === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                    item.mobileOnly && "lg:hidden",
                  )}
                >
                  <item.icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </nav>

            {tab === "sections" && (
              <SectionsPanel editing={editing} onEditingChange={setEditing} feedbacks={feedbacks} />
            )}
            {tab === "theme" && <ThemePanel />}
            {tab === "languages" && <LanguagesPanel guideUrl={guideUrl} />}
            {tab === "share" && <SharePanel guideUrl={guideUrl} />}
            {tab === "preview" && (
              <div className="lg:hidden">
                <PhonePreview
                  guide={guide}
                  focusSection={focusSection}
                  device="phone"
                  language={previewLanguage}
                  onLanguageChange={setPreviewLanguage}
                />
              </div>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Pré-visualização</p>
                <div className="hidden gap-1 rounded-lg border bg-card p-0.5 xl:flex">
                  <Button
                    type="button"
                    size="icon-xs"
                    variant={device === "phone" ? "secondary" : "ghost"}
                    aria-label="Celular"
                    onClick={() => setDevice("phone")}
                  >
                    <Smartphone />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant={device === "tablet" ? "secondary" : "ghost"}
                    aria-label="Tablet"
                    onClick={() => setDevice("tablet")}
                  >
                    <Monitor />
                  </Button>
                </div>
              </div>
              <PhonePreview
                guide={guide}
                focusSection={focusSection}
                device={device}
                language={previewLanguage}
                onLanguageChange={setPreviewLanguage}
              />
            </div>
          </aside>
        </div>
      </div>
    </EditorProvider>
  );
}
