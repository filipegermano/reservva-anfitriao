import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
};

export class UnsafeUrlError extends Error {}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const lower = address.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) return true;
    // NAT64 e IPv4 embutido em IPv6 podem apontar para endereços internos.
    if (lower.startsWith("64:ff9b:")) return true;
    const mapped = lower.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    const hexMapped = lower.match(/^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hexMapped) {
      const high = parseInt(hexMapped[1], 16);
      const low = parseInt(hexMapped[2], 16);
      return isPrivateAddress(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
    }
    return false;
  }

  const [a, b] = address.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

/** Garante que a URL é http(s) pública, para não expor serviços internos. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Link inválido");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Use um link http ou https");
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("Link inválido");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true }).catch(() => {
        throw new UnsafeUrlError("Não foi possível acessar esse endereço");
      });

  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new UnsafeUrlError("Endereço não permitido");
  }

  return url;
}

type SafeFetchOptions = {
  maxBytes: number;
  timeoutMs?: number;
  accept?: string;
};

/**
 * Busca uma URL pública seguindo redirects manualmente (cada salto é
 * validado) e com limite de tamanho e tempo.
 */
export async function safeFetch(
  raw: string,
  { maxBytes, timeoutMs = 15_000, accept }: SafeFetchOptions,
): Promise<{ url: string; contentType: string; body: Buffer }> {
  const signal = AbortSignal.timeout(timeoutMs);
  let current = raw;

  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const url = await assertPublicUrl(current);
    const response = await fetch(url, {
      headers: { ...BROWSER_HEADERS, ...(accept ? { Accept: accept } : {}) },
      redirect: "manual",
      signal,
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) break;
      current = new URL(location, url).toString();
      continue;
    }

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`);
    }

    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > maxBytes) throw new Error("Conteúdo grande demais");

    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("Conteúdo grande demais");
      }
      chunks.push(value);
    }

    return {
      url: url.toString(),
      contentType: (response.headers.get("content-type") ?? "").split(";")[0].trim(),
      body: Buffer.concat(chunks),
    };
  }

  throw new Error("Redirecionamentos demais");
}
