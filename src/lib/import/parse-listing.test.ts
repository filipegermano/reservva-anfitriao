import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  htmlToText,
  isAirbnbUrl,
  mapPropertyType,
  parseAirbnbHtml,
  parseCapacity,
  parseGenericHtml,
  parseListingHtml,
} from "@/lib/import/parse-listing";
import { firstSentence, shortName } from "@/lib/import/listing-draft";

const airbnbHtml = readFileSync(
  new URL("./__fixtures__/airbnb-beach-haus.html", import.meta.url),
  "utf8",
);
const url = "https://www.airbnb.com.br/rooms/1764586878191116484";

describe("parseAirbnbHtml", () => {
  const draft = parseAirbnbHtml(airbnbHtml, url)!;

  it("extrai os dados básicos do anúncio", () => {
    expect(draft).not.toBeNull();
    expect(draft.name).toBe("Beach Haus | Frente mar e piscina na cobertura no Bessa");
    expect(draft.propertyType).toBe("Apartamento");
    expect(draft.city).toBe("João Pessoa, Paraíba");
    expect(draft.sourceUrl).toBe(url);
    expect(draft.latitude).toBeCloseTo(-7.0946);
    expect(draft.longitude).toBeCloseTo(-34.8344);
    expect(draft.welcomeMessage).toBe("Seja muito bem-vindo(a) ao Beach Haus!");
  });

  it("extrai capacidade", () => {
    expect(draft).toMatchObject({ guests: 4, bedrooms: 1, beds: 2, bathrooms: 1 });
  });

  it("separa horários de check-in/out das regras", () => {
    expect(draft.checkInTime).toBe("14:00");
    expect(draft.checkOutTime).toBe("11:00");
    expect(draft.checkInInstructions).toBe("Self check-in com equipe do edifício");
    expect(draft.rules).toEqual([
      "Máximo de 4 hóspedes",
      "Não é permitido animais de estimação",
      "Horário de silêncio: 22:00 - 08:00",
      "Não são permitidas festas ou eventos",
      "Proibido fumar",
    ]);
  });

  it("lista só as comodidades disponíveis", () => {
    expect(draft.amenities).toContain("Wi-Fi");
    expect(draft.amenities).toContain("Ar-condicionado");
    expect(draft.amenities).not.toContain("Aquecedor");
    expect(new Set(draft.amenities).size).toBe(draft.amenities.length);
  });

  it("agrupa fotos por ambiente, com a foto principal primeiro", () => {
    expect(draft.photos.length).toBeGreaterThan(10);
    expect(draft.photos[0].url).toContain("657a11fa-33b5-4951-9026-d60917a2a45b");
    expect(new Set(draft.photos.map((photo) => photo.url)).size).toBe(draft.photos.length);
    expect(draft.rooms.map((room) => room.name)).toContain("Cozinha completa");
    expect(draft.rooms.find((room) => room.name === "Quarto")?.description).toBe(
      "Cama de casal · Sofá-cama",
    );
  });

  it("converte a descrição HTML em texto", () => {
    expect(draft.description).toContain("Flat no Beach Haus");
    expect(draft.description).not.toContain("<br");
    expect(draft.shortDescription.length).toBeLessThanOrEqual(120);
  });

  it("traz os dados do anfitrião", () => {
    expect(draft.hostName).toBe("Filipe");
    expect(draft.hostPhotoUrl).toMatch(/^https:\/\/a0\.muscache\.com/);
    expect(draft.hostBio).toContain("Cuido do flat");
  });

  it("retorna null para páginas que não são do Airbnb", () => {
    expect(parseAirbnbHtml("<html><body>oi</body></html>", null)).toBeNull();
  });
});

describe("parseGenericHtml", () => {
  it("usa JSON-LD e Open Graph", () => {
    const html = `<html><head>
      <meta property="og:image" content="https://example.com/capa.jpg">
      <script type="application/ld+json">${JSON.stringify({
        "@type": "Hotel",
        name: "Pousada Mar &amp; Sol",
        description: "<p>Pousada charmosa. Café da manhã incluso.</p>",
        address: { streetAddress: "Rua A, 10", addressLocality: "Paraty", addressRegion: "RJ" },
        geo: { latitude: -23.2, longitude: -44.7 },
        amenityFeature: [{ name: "Piscina" }, { name: "Wi-Fi" }],
      })}</script></head></html>`;

    const draft = parseGenericHtml(html, "https://example.com/pousada");
    expect(draft.name).toBe("Pousada Mar & Sol");
    expect(draft.propertyType).toBe("Pousada");
    expect(draft.city).toBe("Paraty, RJ");
    expect(draft.address).toBe("Rua A, 10, Paraty, RJ");
    expect(draft.shortDescription).toBe("Pousada charmosa.");
    expect(draft.amenities).toEqual(["Piscina", "Wi-Fi"]);
    expect(draft.photos).toEqual([{ url: "https://example.com/capa.jpg", room: "" }]);
    expect(draft.latitude).toBe(-23.2);
  });

  it("cai no título da página quando não há dados estruturados", () => {
    const draft = parseListingHtml("<title>Casa do Lago</title>", null);
    expect(draft.name).toBe("Casa do Lago");
    expect(draft.propertyType).toBe("Casa");
  });
});

describe("helpers", () => {
  it("parseCapacity", () => {
    expect(parseCapacity(["6 hóspedes", "3 quartos", "4 camas", "2,5 banheiros"])).toEqual({
      guests: 6,
      bedrooms: 3,
      beds: 4,
      bathrooms: 3,
    });
  });

  it("mapPropertyType", () => {
    expect(mapPropertyType("Espaço inteiro: chalé em Campos")).toBe("Chalé");
    expect(mapPropertyType("", "HOUSE")).toBe("Casa");
    expect(mapPropertyType("")).toBe("Apartamento");
  });

  it("htmlToText", () => {
    expect(htmlToText("Linha 1<br />• Item &amp; mais<script>x()</script>")).toBe(
      "Linha 1\n• Item & mais",
    );
  });

  it("firstSentence e shortName", () => {
    expect(firstSentence("Olá mundo. Segunda frase.")).toBe("Olá mundo.");
    expect(firstSentence("a ".repeat(100), 20).length).toBeLessThanOrEqual(20);
    expect(shortName("Beach Haus | Frente mar")).toBe("Beach Haus");
  });

  it("isAirbnbUrl", () => {
    expect(isAirbnbUrl("https://www.airbnb.com.br/rooms/1")).toBe(true);
    expect(isAirbnbUrl("https://airbnb.com/rooms/1")).toBe(true);
    expect(isAirbnbUrl("https://notairbnb.com/rooms/1")).toBe(false);
    expect(isAirbnbUrl("nada")).toBe(false);
  });
});
