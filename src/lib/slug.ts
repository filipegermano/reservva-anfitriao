import { prisma } from "@/lib/prisma";

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

/** Gera um slug único (URL do guia público) a partir do nome do imóvel. */
export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "imovel";

  let candidate = base;
  let attempts = 0;

  while (await prisma.property.findUnique({ where: { slug: candidate } })) {
    attempts += 1;
    candidate = `${base}-${randomSuffix()}`;
    if (attempts > 10) {
      candidate = `${base}-${Date.now()}`;
      break;
    }
  }

  return candidate;
}
