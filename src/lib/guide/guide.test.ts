import { describe, expect, it } from "vitest";

import { contactHref, externalUrl, imageSrc, whatsappUrl } from "@/lib/guide/contacts";
import type { GuideSectionData } from "@/lib/guide/data";
import { mapsSearchUrl } from "@/lib/guide/data";
import { buildSectionsFromDraft } from "@/lib/guide/draft-sections";
import { searchSections, sectionHasContent } from "@/lib/guide/presence";
import { parseSectionContent, sectionMeta, sectionTypes } from "@/lib/guide/sections";
import { emptyDraft } from "@/lib/import/listing-draft";
import { posterContent, posterOptionsSchema, posterTemplates } from "@/lib/poster";
import { defaultThemeId, getTheme, homeTileColors } from "@/lib/guide/themes";
import { collectUploadUrls } from "@/lib/storage";

function section<T extends GuideSectionData["type"]>(
  type: T,
  content: unknown,
  enabled = true,
): GuideSectionData {
  return {
    id: type,
    type,
    title: sectionMeta[type].label,
    enabled,
    order: 0,
    content: parseSectionContent(type, content),
  } as GuideSectionData;
}

describe("parseSectionContent", () => {
  it("preenche valores padrão e descarta campos inválidos", () => {
    expect(parseSectionContent("checkin", { checkInTime: 14, flexible: "sim" })).toEqual({
      checkInTime: "",
      checkOutTime: "",
      checkInInstructions: "",
      checkOutInstructions: "",
      keyLocation: "",
      flexible: false,
    });
    expect(parseSectionContent("wifi", null).networks).toEqual([]);
    expect(parseSectionContent("host", { contacts: [{ type: "fax", value: "1" }] }).contacts).toEqual([
      { type: "whatsapp", value: "1" },
    ]);
  });

  it("aceita só ilustrações conhecidas nos tópicos", () => {
    const items = [
      { title: "Sofá-cama", text: "", illustration: "sofa_bed" },
      { title: "Chuveiro", text: "", illustration: "inexistente" },
      { title: "Fogão", text: "" },
    ];
    expect(
      parseSectionContent("instructions", { intro: "", items }).items.map(
        (item) => item.illustration,
      ),
    ).toEqual(["sofa_bed", null, null]);
  });

  it("tem conteúdo padrão válido para todos os tipos", () => {
    for (const type of sectionTypes) {
      expect(() => sectionMeta[type].defaultContent()).not.toThrow();
    }
    expect(sectionTypes).toHaveLength(18);
  });
});

describe("buildSectionsFromDraft", () => {
  const draft = emptyDraft({
    name: "Casa Azul",
    sourceUrl: "https://www.airbnb.com.br/rooms/1",
    hostName: "Ana",
    amenities: ["Wi-Fi", "Piscina"],
    rules: ["Sem festas"],
    safety: ["Extintor de incêndio"],
    checkInTime: "14:00",
    guests: 4,
    rooms: [{ name: "Quarto", description: "Cama de casal" }],
    photos: [
      { url: "https://img/1.jpg", room: "Quarto" },
      { url: "https://img/2.jpg", room: "" },
    ],
  });
  const sections = buildSectionsFromDraft(draft);
  const byType = Object.fromEntries(sections.map((item) => [item.type, item.content]));

  it("cria as seções padrão e a de segurança", () => {
    expect(sections.map((item) => item.type)).toEqual([
      "host",
      "amenities",
      "rules",
      "about",
      "rooms",
      "wifi",
      "emergency",
      "checkin",
      "local_tips",
      "restaurants",
      "feedback",
      "safety",
    ]);
  });

  it("distribui os dados do anúncio", () => {
    expect(byType.host).toMatchObject({ name: "Ana" });
    expect(byType.amenities).toEqual({ items: ["Wi-Fi", "Piscina"] });
    expect(byType.rules).toEqual({ rules: [{ text: "Sem festas" }] });
    expect(byType.about).toMatchObject({ guests: 4 });
    expect(byType.checkin).toMatchObject({ checkInTime: "14:00" });
    expect(byType.feedback).toMatchObject({ airbnbUrl: "https://www.airbnb.com.br/rooms/1", bookingUrl: "" });
    expect(byType.emergency).toMatchObject({ contacts: expect.arrayContaining([{ name: "SAMU", phone: "192" }]) });
  });

  it("agrupa fotos por ambiente", () => {
    expect(byType.rooms).toEqual({
      rooms: [
        { name: "Quarto", description: "Cama de casal", photos: ["https://img/1.jpg"] },
        { name: "Outros", description: "", photos: ["https://img/2.jpg"] },
      ],
    });
  });
});

describe("presence", () => {
  it("detecta seções vazias", () => {
    expect(sectionHasContent(section("wifi", {}))).toBe(false);
    expect(sectionHasContent(section("wifi", { networks: [{ name: "Casa", password: "" }] }))).toBe(true);
    expect(sectionHasContent(section("transport", { items: [{ title: "", text: "" }] }))).toBe(false);
    expect(sectionHasContent(section("transport", { intro: "Uber funciona bem" }))).toBe(true);
    expect(sectionHasContent(section("local_tips", {}))).toBe(true);
  });

  it("busca sem acento e ignora URLs", () => {
    const sections = [
      section("wifi", { networks: [{ name: "Casa Azul", password: "senha123" }] }),
      section("rules", { rules: [{ text: "Silêncio após as 22h" }] }),
      section("host", { photoUrl: "https://cdn/silencio.jpg" }),
      section("restaurants", {}),
    ];
    const recommendations = [
      { id: "r", category: "RESTAURANTE" as const, name: "Peixada do Zé", description: null, mapsUrl: null },
    ];

    expect(searchSections(sections, recommendations, "silencio").map((r) => r.section.type)).toEqual(["rules"]);
    expect(searchSections(sections, recommendations, "SENHA")[0].snippet).toBe("senha123");
    expect(searchSections(sections, recommendations, "peixada").map((r) => r.section.type)).toEqual(["restaurants"]);
    expect(searchSections(sections, recommendations, "wi")).toHaveLength(1);
    expect(searchSections(sections, recommendations, "a")).toEqual([]);
  });
});

describe("contacts", () => {
  it("monta links de contato seguros", () => {
    expect(contactHref("whatsapp", "(83) 99999-0000")).toBe("https://wa.me/5583999990000");
    expect(contactHref("whatsapp", "+351 912 345 678")).toBe("https://wa.me/351912345678");
    expect(contactHref("phone", "(83) 3333-4444")).toBe("tel:8333334444");
    expect(contactHref("email", "a@b.com")).toBe("mailto:a@b.com");
    expect(contactHref("email", "não é email")).toBeNull();
    expect(contactHref("instagram", "@casa.azul")).toBe("https://instagram.com/casa.azul");
    expect(contactHref("site", "casa.com.br")).toBe("https://casa.com.br/");
    expect(contactHref("site", "javascript:alert(1)")).toBeNull();
    expect(whatsappUrl("")).toBeNull();
  });

  it("só aceita imagens e links http(s)", () => {
    expect(externalUrl("javascript:alert(1)")).toBeNull();
    expect(externalUrl("https://maps.app.goo.gl/x")).toBe("https://maps.app.goo.gl/x");
    expect(imageSrc("/api/uploads/properties/1/a.jpg")).toBe("/api/uploads/properties/1/a.jpg");
    expect(imageSrc("data:image/png;base64,xx")).toBeNull();
  });

  it("gera buscas no mapa pela localização", () => {
    expect(
      mapsSearchUrl("Farmácias", { address: null, city: null, latitude: -7.09, longitude: -34.83 }),
    ).toBe("https://www.google.com/maps/search/?api=1&query=Farm%C3%A1cias%20perto%20de%20-7.09%2C-34.83");
  });
});

describe("posterContent", () => {
  it("usa apenas seções ativas", () => {
    const content = posterContent({
      property: {
        id: "p",
        name: "Casa Azul",
        slug: "casa-azul",
        propertyType: null,
        address: null,
        city: "Ubatuba",
        coverImageUrl: null,
        showCover: true,
        welcomeMessage: "Bem-vindo!",
        shortDescription: null,
        theme: "moderno",
        published: true,
        latitude: null,
        longitude: null,
      },
      recommendations: [],
      translations: {},
      sections: [
        section("wifi", { networks: [{ name: "", password: "" }, { name: "Casa", password: "123" }] }),
        section("rules", { rules: Array.from({ length: 8 }, (_, i) => ({ text: `Regra ${i}` })) }),
        section("checkin", { checkInTime: "15:00" }, false),
        section("host", { name: "Ana", contacts: [{ type: "email", value: "a@b.com" }, { type: "whatsapp", value: "839" }] }),
      ],
    });

    expect(content.wifi).toEqual({ name: "Casa", password: "123" });
    expect(content.rules).toHaveLength(8);
    expect(content.checkInTime).toBe("");
    expect(content.contact).toBe("Ana · 839");
  });
});

describe("collectUploadUrls", () => {
  it("encontra uploads em qualquer nível do conteúdo", () => {
    const found = collectUploadUrls({
      photoUrl: "/api/uploads/properties/p/a.jpg",
      rooms: [{ photos: ["/api/uploads/properties/p/b.jpg", "https://externo/c.jpg"] }],
    });
    expect([...found].sort()).toEqual([
      "/api/uploads/properties/p/a.jpg",
      "/api/uploads/properties/p/b.jpg",
    ]);
  });
});

describe("homeTileColors", () => {
  const grafite = getTheme("grafite");

  it("usa o Grafite como tema padrão", () => {
    expect(defaultThemeId).toBe("grafite");
    expect(getTheme("inexistente").id).toBe("grafite");
  });

  it("destaca o card do Wi-Fi e alterna os demais em xadrez", () => {
    expect(homeTileColors(grafite, { tone: 5, index: 3, featured: true })).toBe(grafite.featuredTile);
    const shades = [0, 1, 2, 3].map(
      (index) => homeTileColors(grafite, { tone: 0, index, featured: false }).background,
    );
    expect(shades).toEqual(["#ffffff", "#ececeb", "#ececeb", "#ffffff"]);
  });

  it("mantém a cor por tipo de seção nos temas coloridos", () => {
    const moderno = getTheme("moderno");
    expect(homeTileColors(moderno, { tone: 2, index: 0, featured: true })).toBe(moderno.tiles[2]);
  });
});

describe("tema verde sálvia e cartaz A6", () => {
  it("existe no guia digital e no cartaz", () => {
    expect(getTheme("salvia").name).toBe("Verde sálvia");
    expect(posterTemplates.some((template) => template.id === "salvia")).toBe(true);
  });

  it("aceita o tamanho A6 nas opções do cartaz", () => {
    expect(posterOptionsSchema.parse({ template: "salvia", size: "A6" })).toMatchObject({
      template: "salvia",
      size: "A6",
    });
    expect(posterOptionsSchema.parse({ size: "A7" }).size).toBe("A4");
  });
});
