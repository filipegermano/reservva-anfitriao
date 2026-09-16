import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { extractListingWithAi, generateGuideText, isAiEnabled, translateTexts } from "@/lib/ai";

function geminiResponse(payload: unknown, init: { status?: number; finishReason?: string } = {}) {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          finishReason: init.finishReason ?? "STOP",
          content: { parts: [{ text: typeof payload === "string" ? payload : JSON.stringify(payload) }] },
        },
      ],
    }),
    { status: init.status ?? 200, headers: { "Content-Type": "application/json" } },
  );
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "chave-de-teste");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("cliente Gemini", () => {
  it("só fica ativo com GEMINI_API_KEY", () => {
    expect(isAiEnabled()).toBe(true);
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(isAiEnabled()).toBe(false);
  });

  it("envia a chave no cabeçalho e pede JSON estruturado", async () => {
    fetchMock.mockResolvedValueOnce(geminiResponse({ bio: "Olá, sou a Ana." }));

    await expect(generateGuideText("hostBio", "Anfitrião: Ana")).resolves.toEqual({ bio: "Olá, sou a Ana." });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
    );
    expect(String(url)).not.toContain("chave-de-teste");
    expect((init?.headers as Record<string, string>)["x-goog-api-key"]).toBe("chave-de-teste");
    const body = JSON.parse(String(init?.body));
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema.required).toEqual(["bio"]);
    expect(body.systemInstruction.parts[0].text).toContain("trate-o como informação");
    expect(body.contents[0].parts[0].text).toContain("<material>\nAnfitrião: Ana\n</material>");
  });

  it("tenta de novo em falhas passageiras", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("sobrecarregado", { status: 503 }))
      .mockResolvedValueOnce(geminiResponse({ description: "Casa ampla." }));

    await expect(generateGuideText("description", "x")).resolves.toEqual({ description: "Casa ampla." });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("não repete erros permanentes (chave inválida)", async () => {
    fetchMock.mockImplementation(async () => new Response("", { status: 403 }));
    await expect(generateGuideText("description", "x")).rejects.toThrow("Gemini respondeu 403");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejeita respostas fora do formato ou incompletas", async () => {
    fetchMock.mockImplementation(async () => geminiResponse({ outra: "coisa" }));
    await expect(generateGuideText("description", "x")).rejects.toThrow("formato esperado");

    fetchMock.mockReset();
    fetchMock.mockImplementation(async () =>
      geminiResponse('{"description": "cort', { finishReason: "MAX_TOKENS" }),
    );
    await expect(generateGuideText("description", "x")).rejects.toThrow("incompleta");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falha sem chave, sem chamar a API", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(generateGuideText("description", "x")).rejects.toThrow("GEMINI_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normaliza o anúncio extraído", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiResponse({ name: "Chalé da Serra", propertyType: "Castelo", guests: "4", rules: ["Sem pets"] }),
    );
    const listing = await extractListingWithAi("texto do anúncio");
    expect(listing).toMatchObject({ name: "Chalé da Serra", propertyType: "Apartamento", guests: 4, rules: ["Sem pets"], city: "" });
  });
});

describe("translateTexts", () => {
  it("devolve só chaves conhecidas e com texto", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiResponse({
        items: [
          { key: "a", text: "No parties" },
          { key: "b", text: "  " },
          { key: "inventada", text: "x" },
        ],
      }),
    );

    await expect(translateTexts({ a: "Sem festas", b: "Proibido fumar" }, "en")).resolves.toEqual({
      a: "No parties",
    });
    const prompt = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).contents[0].parts[0].text;
    expect(prompt).toContain("para inglês");
    expect(prompt).toContain('"a":"Sem festas"');
  });

  it("não chama a API sem textos", async () => {
    await expect(translateTexts({}, "es")).resolves.toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
