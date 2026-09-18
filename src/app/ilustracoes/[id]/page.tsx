import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { guideStrings } from "@/lib/guide/i18n";
import { languageLabels, type GuideLanguage } from "@/lib/guide/translation";
import { isIllustrationId } from "@/components/guide/illustrations/ids";
import { SofaBedSheet } from "@/components/guide/illustrations/sheet";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Folha imprimível de uma ilustração. O anfitrião abre, imprime pelo navegador
 * e cola perto do móvel. `?lang=` escolhe o idioma dos textos.
 */
export default async function IllustrationSheetPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  if (!isIllustrationId(id)) notFound();

  const { lang } = await searchParams;
  const language: GuideLanguage = lang && lang in languageLabels ? (lang as GuideLanguage) : "pt";
  const strings = guideStrings[language].illustrations.sofaBed;

  return <SofaBedSheet title={strings.title} captions={strings.steps} />;
}
