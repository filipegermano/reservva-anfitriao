"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { GuideData, GuideProperty, GuideRecommendation, GuideSectionData } from "@/lib/guide/data";
import type { SectionType } from "@/lib/guide/sections";

export type SaveState = { status: "idle" | "saving" | "saved" | "error"; savedAt: Date | null };

export type PropertyPatch = Partial<
  Pick<
    GuideProperty,
    | "name"
    | "propertyType"
    | "address"
    | "city"
    | "welcomeMessage"
    | "shortDescription"
    | "showCover"
    | "theme"
    | "published"
    | "coverImageUrl"
  >
>;

export type SectionPatch = Partial<Pick<GuideSectionData, "title" | "enabled" | "content">>;

const AUTOSAVE_DELAY = 700;

async function sendJson(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "Não foi possível salvar");
  return data;
}

/**
 * Estado do editor com salvamento automático: as mudanças aparecem na hora
 * (inclusive no preview) e são enviadas ao servidor com debounce.
 */
export function useGuideEditor(initial: GuideData) {
  const [guide, setGuide] = useState(initial);
  const [save, setSave] = useState<SaveState>({ status: "idle", savedAt: null });

  const pending = useRef(new Map<string, { url: string; body: Record<string, unknown> }>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inFlight = useRef(0);
  const chains = useRef(new Map<string, Promise<void>>());

  const propertyUrl = `/api/properties/${initial.property.id}`;

  const send = useCallback(async (job: { url: string; body: Record<string, unknown> }) => {
    inFlight.current += 1;
    setSave((current) => ({ ...current, status: "saving" }));
    try {
      await sendJson(job.url, "PATCH", job.body);
      inFlight.current -= 1;
      if (inFlight.current === 0 && pending.current.size === 0) {
        setSave({ status: "saved", savedAt: new Date() });
      }
    } catch (error) {
      inFlight.current -= 1;
      setSave((current) => ({ ...current, status: "error" }));
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar");
    }
  }, []);

  /** Envia o que estiver pendente para a chave, sempre em ordem. */
  const flushKey = useCallback(
    (key: string) => {
      clearTimeout(timers.current.get(key));
      timers.current.delete(key);
      const job = pending.current.get(key);
      if (!job) return chains.current.get(key) ?? Promise.resolve();
      pending.current.delete(key);

      const next = (chains.current.get(key) ?? Promise.resolve()).then(() => send(job));
      chains.current.set(key, next);
      return next;
    },
    [send],
  );

  const schedule = useCallback(
    (key: string, url: string, body: Record<string, unknown>) => {
      const previous = pending.current.get(key);
      pending.current.set(key, { url, body: { ...previous?.body, ...body } });
      clearTimeout(timers.current.get(key));
      timers.current.set(key, setTimeout(() => void flushKey(key), AUTOSAVE_DELAY));
      setSave((current) => ({ ...current, status: "saving" }));
    },
    [flushKey],
  );

  const flushAll = useCallback(async () => {
    await Promise.all([...pending.current.keys()].map((key) => flushKey(key)));
  }, [flushKey]);

  // Não perde alterações ao sair da página.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pending.current.size > 0) {
        void flushAll();
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [flushAll]);

  const updateProperty = useCallback(
    (patch: PropertyPatch) => {
      setGuide((current) => ({ ...current, property: { ...current.property, ...patch } }));
      schedule("property", propertyUrl, patch);
    },
    [propertyUrl, schedule],
  );

  /** Atualizações que precisam de confirmação imediata (publicar, capa). */
  const updatePropertyNow = useCallback(
    async (patch: PropertyPatch & { removeCover?: true }) => {
      setSave((current) => ({ ...current, status: "saving" }));
      try {
        const { property } = await sendJson(propertyUrl, "PATCH", patch);
        setGuide((current) => ({
          ...current,
          property: {
            ...current.property,
            ...patch,
            coverImageUrl: property.coverImageUrl,
            published: property.published,
          },
        }));
        setSave({ status: "saved", savedAt: new Date() });
        return true;
      } catch (error) {
        setSave((current) => ({ ...current, status: "error" }));
        toast.error(error instanceof Error ? error.message : "Não foi possível salvar");
        return false;
      }
    },
    [propertyUrl],
  );

  const setCoverImage = useCallback((coverImageUrl: string | null) => {
    setGuide((current) => ({ ...current, property: { ...current.property, coverImageUrl } }));
  }, []);

  const updateSection = useCallback(
    (sectionId: string, patch: SectionPatch) => {
      setGuide((current) => ({
        ...current,
        sections: current.sections.map((section) =>
          section.id === sectionId ? ({ ...section, ...patch } as GuideSectionData) : section,
        ),
      }));
      schedule(`section:${sectionId}`, `${propertyUrl}/sections/${sectionId}`, patch);
    },
    [propertyUrl, schedule],
  );

  const addSection = useCallback(
    async (type: SectionType) => {
      try {
        const { section } = await sendJson(`${propertyUrl}/sections`, "POST", { type });
        setGuide((current) => ({ ...current, sections: [...current.sections, section] }));
        return section as GuideSectionData;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível adicionar a seção");
        return null;
      }
    },
    [propertyUrl],
  );

  const removeSection = useCallback(
    async (sectionId: string) => {
      const key = `section:${sectionId}`;
      clearTimeout(timers.current.get(key));
      pending.current.delete(key);
      timers.current.delete(key);

      const response = await fetch(`${propertyUrl}/sections/${sectionId}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error("Não foi possível remover a seção");
        return;
      }
      setGuide((current) => ({
        ...current,
        sections: current.sections.filter((section) => section.id !== sectionId),
      }));
    },
    [propertyUrl],
  );

  const moveSection = useCallback(
    async (sectionId: string, direction: -1 | 1) => {
      const ids = guide.sections.map((section) => section.id);
      const index = ids.indexOf(sectionId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ids.length) return;
      [ids[index], ids[target]] = [ids[target], ids[index]];

      const previous = guide.sections;
      setGuide((current) => ({
        ...current,
        sections: ids.map((id) => current.sections.find((section) => section.id === id)!),
      }));

      try {
        await sendJson(`${propertyUrl}/sections/order`, "PUT", { ids });
      } catch (error) {
        setGuide((current) => ({ ...current, sections: previous }));
        toast.error(error instanceof Error ? error.message : "Não foi possível reordenar");
      }
    },
    [guide.sections, propertyUrl],
  );

  const setRecommendations = useCallback(
    (update: (current: GuideRecommendation[]) => GuideRecommendation[]) => {
      setGuide((current) => ({ ...current, recommendations: update(current.recommendations) }));
    },
    [],
  );

  return {
    guide,
    save,
    updateProperty,
    updatePropertyNow,
    setCoverImage,
    updateSection,
    addSection,
    removeSection,
    moveSection,
    setRecommendations,
    flushAll,
  };
}

export type GuideEditorApi = ReturnType<typeof useGuideEditor>;
