import { describe, expect, it } from "vitest";

import { posterDensityLevels, wrapUrl } from "@/components/pdf/poster-document";
import { posterOptionsSchema } from "@/lib/poster";

describe("wrapUrl", () => {
  it("remove o protocolo e quebra nos separadores sem acrescentar traços", () => {
    const url = "https://anfitriao.reservva.com.br/g/beach-haus-frente-mar-e-piscina-na-cobertura";
    const lines = wrapUrl(url, 30).split("\n");
    expect(lines.join("")).toBe(url.replace("https://", ""));
    expect(lines.every((line) => line.length <= 30)).toBe(true);
    expect(lines.length).toBeGreaterThan(1);
  });

  it("corta pedaços maiores que a linha", () => {
    expect(wrapUrl("https://a.com/" + "x".repeat(25), 10).split("\n").every((l) => l.length <= 10)).toBe(true);
  });

  it("mantém links curtos em uma linha", () => {
    expect(wrapUrl("https://a.com/g/casa", 40)).toBe("a.com/g/casa");
  });
});

describe("opções do cartaz", () => {
  it("mostra o contato por padrão e permite ocultar", () => {
    expect(posterOptionsSchema.parse({}).showContact).toBe(true);
    expect(posterOptionsSchema.parse({ showContact: "0" }).showContact).toBe(false);
  });

  it("só reduz regras nos níveis mais compactos", () => {
    const first = posterDensityLevels.findIndex((level) => level.maxRules < 8);
    expect(first).toBeGreaterThan(3);
    expect(posterDensityLevels.at(-1)!.maxRules).toBeGreaterThanOrEqual(3);
  });
});
