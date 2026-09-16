import { NextResponse } from "next/server";

import { requireOwnedProperty } from "@/lib/api";
import { isAiEnabled } from "@/lib/ai";
import { removeTranslation, translateGuide } from "@/lib/guide/translate-guide";
import { isTranslationLanguage } from "@/lib/guide/translation";

type RouteParams = { params: Promise<{ id: string; language: string }> };

// Traduzir um guia grande pode levar alguns segundos por lote.
export const maxDuration = 300;

/** Traduz (ou atualiza a tradução de) o guia para o idioma informado. */
export async function POST(_request: Request, { params }: RouteParams) {
  const { id, language } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  if (!isTranslationLanguage(language)) {
    return NextResponse.json({ error: "Idioma não suportado" }, { status: 400 });
  }
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "Recursos de IA não configurados" }, { status: 503 });
  }

  try {
    const translation = await translateGuide(id, language);
    return NextResponse.json({ translation });
  } catch (error) {
    console.error("[translate]", error);
    return NextResponse.json(
      { error: "Não foi possível traduzir agora. Tente novamente em instantes." },
      { status: 502 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, language } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  if (!isTranslationLanguage(language)) {
    return NextResponse.json({ error: "Idioma não suportado" }, { status: 400 });
  }

  await removeTranslation(id, language);
  return NextResponse.json({ ok: true });
}
