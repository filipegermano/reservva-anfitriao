import { describe, expect, it } from "vitest";

import type { GuideData, GuideSectionData } from "@/lib/guide/data";
import { parseSectionContent, sectionMeta } from "@/lib/guide/sections";
import {
  applyTranslation,
  availableLanguages,
  chunkTexts,
  collectGuideTexts,
  parseTranslations,
  textsFingerprint,
  translationStatus,
} from "@/lib/guide/translation";

function section(id: string, type: GuideSectionData["type"], content: unknown): GuideSectionData {
  return {
    id,
    type,
    title: sectionMeta[type].label,
    enabled: true,
    order: 0,
    content: parseSectionContent(type, content),
  } as GuideSectionData;
}

function makeGuide(overrides: Partial<GuideData> = {}): GuideData {
  return {
    property: {
      id: "p",
      name: "Casa Azul",
      slug: "casa-azul",
      propertyType: "Casa",
      address: "Rua A, 10",
      city: "Paraty, RJ",
      coverImageUrl: null,
      showCover: true,
      welcomeMessage: "Seja bem-vindo!",
      shortDescription: "",
      theme: "grafite",
      published: true,
      latitude: null,
      longitude: null,
    },
    sections: [
      section("w", "wifi", { networks: [{ name: "CasaAzul", password: "senha123" }], notes: "Roteador na sala" }),
      section("r", "rules", { rules: [{ text: "Sem festas" }, { text: "" }, { text: "Proibido fumar" }] }),
      section("h", "host", { name: "Ana", bio: "Adoro receber", contacts: [{ type: "whatsapp", value: "839" }] }),
    ],
    recommendations: [
      { id: "rec", category: "RESTAURANTE", name: "Peixada do Zé", description: "Moqueca ótima", mapsUrl: null },
    ],
    translations: {},
    ...overrides,
  };
}

describe("collectGuideTexts", () => {
  it("coleta só textos livres, sem nomes, senhas e contatos", () => {
    const texts = collectGuideTexts(makeGuide());
    expect(texts).toEqual({
      "p.name": "Casa Azul",
      "p.welcomeMessage": "Seja bem-vindo!",
      "p.propertyType": "Casa",
      "p.city": "Paraty, RJ",
      "s.w.title": "Wi-Fi",
      "s.w.c.notes": "Roteador na sala",
      "s.r.title": "Regras da Casa",
      "s.r.c.rules.0.text": "Sem festas",
      "s.r.c.rules.2.text": "Proibido fumar",
      "s.h.title": "Anfitrião",
      "s.h.c.bio": "Adoro receber",
      "r.rec.description": "Moqueca ótima",
    });
    expect(Object.values(texts)).not.toContain("senha123");
    expect(Object.values(texts)).not.toContain("Ana");
  });
});

describe("applyTranslation", () => {
  const guide = makeGuide({
    translations: {
      en: {
        translatedAt: "2026-09-16T12:00:00.000Z",
        fingerprint: "x",
        texts: {
          "p.welcomeMessage": "Welcome!",
          "s.r.title": "House rules",
          "s.r.c.rules.0.text": "No parties",
          "s.w.c.notes": "Router in the living room",
          "r.rec.description": "Great moqueca",
          "s.gone.title": "Seção removida",
        },
      },
    },
  });

  it("aplica os textos traduzidos e mantém o resto no original", () => {
    const translated = applyTranslation(guide, "en");
    expect(translated.property.welcomeMessage).toBe("Welcome!");
    expect(translated.property.name).toBe("Casa Azul");
    const rules = translated.sections.find((item) => item.id === "r")!;
    expect(rules.title).toBe("House rules");
    expect(rules.content).toEqual({
      rules: [{ text: "No parties" }, { text: "" }, { text: "Proibido fumar" }],
    });
    const wifi = translated.sections.find((item) => item.id === "w")!;
    expect(wifi.content).toMatchObject({ notes: "Router in the living room", networks: [{ password: "senha123" }] });
    expect(translated.recommendations[0].description).toBe("Great moqueca");
  });

  it("não altera o guia original nem idiomas sem tradução", () => {
    applyTranslation(guide, "en");
    expect(guide.sections.find((item) => item.id === "r")!.title).toBe("Regras da Casa");
    expect(applyTranslation(guide, "es")).toBe(guide);
    expect(applyTranslation(guide, "pt")).toBe(guide);
  });

  it("ignora caminhos que não existem mais (lista encolheu)", () => {
    const shrunk = makeGuide({
      sections: [section("r", "rules", { rules: [{ text: "Sem festas" }] })],
      translations: {
        en: { translatedAt: "", fingerprint: "", texts: { "s.r.c.rules.5.text": "Old rule" } },
      },
    });
    expect(applyTranslation(shrunk, "en").sections[0].content).toEqual({ rules: [{ text: "Sem festas" }] });
  });
});

describe("status e idiomas", () => {
  it("detecta tradução em dia e desatualizada", () => {
    const guide = makeGuide();
    const fingerprint = textsFingerprint(collectGuideTexts(guide));
    expect(translationStatus(guide, "en")).toBe("missing");

    const translated = makeGuide({ translations: { en: { translatedAt: "", fingerprint, texts: {} } } });
    expect(translationStatus(translated, "en")).toBe("current");
    expect(availableLanguages(translated)).toEqual(["pt", "en"]);

    translated.property.welcomeMessage = "Olá!";
    expect(translationStatus(translated, "en")).toBe("outdated");
  });

  it("a impressão digital não depende da ordem", () => {
    expect(textsFingerprint({ a: "1", b: "2" })).toBe(textsFingerprint({ b: "2", a: "1" }));
    expect(textsFingerprint({ a: "1" })).not.toBe(textsFingerprint({ a: "2" }));
  });

  it("descarta dados inválidos e campos internos ao ler do banco", () => {
    expect(parseTranslations(null)).toEqual({});
    expect(parseTranslations({ en: { texts: "x" } })).toEqual({});
    expect(
      parseTranslations({ en: { translatedAt: "t", fingerprint: "f", texts: {} }, enSources: { a: "b" } }),
    ).toEqual({ en: { translatedAt: "t", fingerprint: "f", texts: {} } });
  });
});

describe("chunkTexts", () => {
  it("divide por quantidade e por tamanho", () => {
    const texts = Object.fromEntries(Array.from({ length: 130 }, (_, i) => [`k${i}`, "x"]));
    expect(chunkTexts(texts).map((chunk) => Object.keys(chunk).length)).toEqual([60, 60, 10]);

    const big = { a: "x".repeat(5000), b: "y".repeat(5000), c: "z" };
    expect(chunkTexts(big).map((chunk) => Object.keys(chunk))).toEqual([["a"], ["b", "c"]]);
  });
});
