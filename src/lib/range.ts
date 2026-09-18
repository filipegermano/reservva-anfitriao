/**
 * Lê o cabeçalho `Range` de uma requisição. Serve para o vídeo das seções: o
 * Safari do iPhone pede um trecho antes de tocar e espera resposta 206.
 */
export function parseRange(header: string | null, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? "");
  if (!match || size <= 0) return null;

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return null;

  // "bytes=-500" pede os últimos 500 bytes.
  const start = rawStart ? Number(rawStart) : Math.max(size - Number(rawEnd), 0);
  const end = rawStart ? Math.min(Number(rawEnd || size - 1), size - 1) : size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) return null;
  return { start, end };
}
