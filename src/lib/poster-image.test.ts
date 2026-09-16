import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage", () => ({
  readUpload: vi.fn(async () =>
    sharp({ create: { width: 2400, height: 1200, channels: 3, background: "#5f7d61" } })
      .webp()
      .toBuffer(),
  ),
}));

import { loadPosterImage } from "@/lib/poster-image";
import { posterOptionsSchema } from "@/lib/poster";

describe("loadPosterImage", () => {
  it("converte a capa (inclusive WebP) em JPEG reduzido", async () => {
    const dataUri = await loadPosterImage("/api/uploads/properties/p/cover.webp");
    expect(dataUri).toMatch(/^data:image\/jpeg;base64,/);
    const meta = await sharp(Buffer.from(dataUri!.split(",")[1], "base64")).metadata();
    expect(meta.format).toBe("jpeg");
    expect(meta.width).toBe(1600);
  });

  it("ignora capas ausentes ou com endereço inválido", async () => {
    expect(await loadPosterImage(null)).toBeNull();
    expect(await loadPosterImage("javascript:alert(1)")).toBeNull();
  });

  it("mostra a foto por padrão e permite desligar", () => {
    expect(posterOptionsSchema.parse({}).showImage).toBe(true);
    expect(posterOptionsSchema.parse({ showImage: "0" }).showImage).toBe(false);
  });
});
