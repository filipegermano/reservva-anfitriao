"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

import { guideStrings, type GuideStrings } from "@/lib/guide/i18n";
import type { GuideLanguage } from "@/lib/guide/translation";

const StringsContext = createContext<GuideStrings>(guideStrings.pt);

export const GuideStringsProvider = StringsContext.Provider;

export function useGuideStrings(): GuideStrings {
  return useContext(StringsContext);
}

const STORAGE_KEY = "reservva-guia-idioma";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readPreference(): string {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl) return fromUrl;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // armazenamento indisponível (aba anônima etc.)
  }
  return navigator.language.slice(0, 2).toLowerCase();
}

/**
 * Idioma do guia público: `?lang=` na URL, depois a última escolha do
 * hóspede, depois o idioma do celular. Só vale se houver tradução.
 */
export function usePreferredLanguage(available: GuideLanguage[]): [GuideLanguage, (language: GuideLanguage) => void] {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "pt");
  const language = (available as string[]).includes(preference) ? (preference as GuideLanguage) : "pt";

  function setLanguage(next: GuideLanguage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // segue sem lembrar a escolha
    }
    const url = new URL(window.location.href);
    if (url.searchParams.has("lang")) {
      url.searchParams.delete("lang");
      window.history.replaceState(null, "", url);
    }
    listeners.forEach((listener) => listener());
  }

  return [language, setLanguage];
}
