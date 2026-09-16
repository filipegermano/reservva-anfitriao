import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ property: null as Record<string, unknown> | null }));
const translateTexts = vi.hoisted(() =>
  vi.fn(async (texts: Record<string, string>) =>
    Object.fromEntries(Object.entries(texts).map(([key, value]) => [key, `EN:${value}`])),
  ),
);

vi.mock("@/lib/ai", () => ({ translateTexts }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUniqueOrThrow: vi.fn(async () => db.property),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        db.property = { ...db.property, ...data };
        return db.property;
      }),
    },
  },
}));

import { removeTranslation, translateGuide } from "@/lib/guide/translate-guide";

function property(rules: string[], translations: unknown = null) {
  return {
    id: "p",
    userId: "u",
    name: "Casa Azul",
    slug: "casa-azul",
    propertyType: null,
    address: null,
    city: null,
    coverImageUrl: null,
    showCover: true,
    welcomeMessage: "Bem-vindo!",
    shortDescription: null,
    theme: "grafite",
    published: true,
    publishedAt: null,
    viewCount: 0,
    sourceUrl: null,
    latitude: null,
    longitude: null,
    translations,
    createdAt: new Date(),
    updatedAt: new Date(),
    recommendations: [],
    sections: [
      {
        id: "r",
        propertyId: "p",
        type: "rules",
        title: "Regras",
        enabled: true,
        order: 0,
        content: { rules: rules.map((text) => ({ text })) },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };
}

beforeEach(() => {
  translateTexts.mockClear();
});

describe("translateGuide", () => {
  it("traduz tudo na primeira vez e guarda os originais", async () => {
    db.property = property(["Sem festas", "Proibido fumar"]);

    const translation = await translateGuide("p", "en");

    expect(translateTexts).toHaveBeenCalledTimes(1);
    expect(translation.texts).toMatchObject({
      "p.welcomeMessage": "EN:Bem-vindo!",
      "s.r.c.rules.0.text": "EN:Sem festas",
    });
    const stored = db.property!.translations as Record<string, unknown>;
    expect(stored.en).toEqual(translation);
    expect(stored.enSources).toMatchObject({ "s.r.c.rules.1.text": "Proibido fumar" });
  });

  it("na atualização só envia o que mudou e preserva outros idiomas", async () => {
    db.property = property(["Sem festas", "Proibido fumar"]);
    await translateGuide("p", "en");
    const stored = db.property!.translations as Record<string, unknown>;
    db.property = property(["Sem festas", "Não fumar dentro de casa", "Silêncio às 22h"], {
      ...stored,
      es: { translatedAt: "t", fingerprint: "f", texts: { "p.name": "Casa Azul" } },
    });
    translateTexts.mockClear();

    const translation = await translateGuide("p", "en");

    expect(translateTexts).toHaveBeenCalledTimes(1);
    expect(translateTexts.mock.calls[0][0]).toEqual({
      "s.r.c.rules.1.text": "Não fumar dentro de casa",
      "s.r.c.rules.2.text": "Silêncio às 22h",
    });
    expect(translation.texts["s.r.c.rules.0.text"]).toBe("EN:Sem festas");
    expect(translation.texts["s.r.c.rules.1.text"]).toBe("EN:Não fumar dentro de casa");
    expect((db.property!.translations as Record<string, unknown>).es).toBeDefined();
  });

  it("remove um idioma sem afetar o outro", async () => {
    db.property = property(["Sem festas"], {
      en: { translatedAt: "t", fingerprint: "f", texts: {} },
      enSources: {},
      es: { translatedAt: "t", fingerprint: "f", texts: {} },
    });

    await removeTranslation("p", "en");

    expect(Object.keys(db.property!.translations as object)).toEqual(["es"]);
  });
});
