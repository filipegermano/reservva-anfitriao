"use client";

import { useState } from "react";
import { ExternalLink, Languages, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  languageLabels,
  translationLanguages,
  translationStatus,
  type TranslationLanguage,
} from "@/lib/guide/translation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEditor } from "@/components/editor/editor-context";

const statusLabels = {
  missing: { text: "Não traduzido", className: "bg-muted text-muted-foreground" },
  current: { text: "Tradução em dia", className: "bg-emerald-100 text-emerald-800" },
  outdated: { text: "Desatualizada", className: "bg-amber-100 text-amber-800" },
};

export function LanguagesPanel({ guideUrl }: { guideUrl: string }) {
  const { propertyId, aiEnabled, editor } = useEditor();
  const { guide } = editor;
  const [busy, setBusy] = useState<TranslationLanguage | null>(null);

  async function translate(language: TranslationLanguage) {
    setBusy(language);
    try {
      await editor.flushAll();
      const response = await fetch(`/api/properties/${propertyId}/translations/${language}`, {
        method: "POST",
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "Não foi possível traduzir");
        return;
      }
      editor.setTranslations({ ...editor.guide.translations, [language]: body.translation });
      toast.success(`Guia traduzido para ${languageLabels[language].name}. Revise na prévia.`);
    } finally {
      setBusy(null);
    }
  }

  async function remove(language: TranslationLanguage) {
    setBusy(language);
    const response = await fetch(`/api/properties/${propertyId}/translations/${language}`, {
      method: "DELETE",
    }).catch(() => null);
    setBusy(null);
    if (!response?.ok) {
      toast.error("Não foi possível remover a tradução");
      return;
    }
    const next = { ...editor.guide.translations };
    delete next[language];
    editor.setTranslations(next);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Idiomas do guia</h2>
        <p className="text-sm text-muted-foreground">
          Traduza o guia para hóspedes estrangeiros. Eles escolhem o idioma no próprio guia, que também abre
          sozinho no idioma do celular. Botões e menus já são traduzidos automaticamente.
        </p>
      </div>

      {!aiEnabled && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          A tradução usa IA (Gemini) e ainda não está configurada: defina a variável GEMINI_API_KEY no servidor.
        </p>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>
              {languageLabels.pt.flag}
            </span>
            <div>
              <p className="font-medium">{languageLabels.pt.name}</p>
              <p className="text-xs text-muted-foreground">Idioma original do guia</p>
            </div>
          </div>
        </div>

        {translationLanguages.map((language) => {
          const status = translationStatus(guide, language);
          const translation = guide.translations[language];
          const working = busy === language;
          return (
            <div key={language} className="space-y-3 rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {languageLabels[language].flag}
                  </span>
                  <div>
                    <p className="font-medium">{languageLabels[language].name}</p>
                    <p className="text-xs text-muted-foreground">
                      {translation
                        ? `Traduzido em ${new Date(translation.translatedAt).toLocaleString("pt-BR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}`
                        : "Ainda não disponível para os hóspedes"}
                    </p>
                  </div>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusLabels[status].className)}>
                  {statusLabels[status].text}
                </span>
              </div>

              {status === "outdated" && (
                <p className="text-xs text-muted-foreground">
                  O guia mudou depois da tradução. Os textos novos ou editados aparecem em português até você
                  atualizar.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={status === "current" ? "outline" : "default"}
                  disabled={!aiEnabled || busy !== null}
                  onClick={() => translate(language)}
                >
                  {working ? <Loader2 className="animate-spin" /> : <Languages />}
                  {working
                    ? "Traduzindo…"
                    : status === "missing"
                      ? "Traduzir"
                      : status === "outdated"
                        ? "Atualizar tradução"
                        : "Traduzir de novo"}
                </Button>
                {translation && (
                  <>
                    <Button asChild size="sm" variant="outline">
                      <a href={`${guideUrl}?lang=${language}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink /> Ver guia
                      </a>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      disabled={busy !== null}
                      onClick={() => remove(language)}
                    >
                      <Trash2 /> Remover
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Nomes de pessoas, redes Wi-Fi, senhas, telefones e links não são traduzidos. Atualizar uma tradução só envia
        para a IA os textos novos ou editados.
      </p>
    </div>
  );
}
