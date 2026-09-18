import { prisma } from "@/lib/prisma";

/** Busca um imóvel garantindo que pertence à conta informada. */
export async function getAccountProperty(propertyId: string, accountId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property || property.accountId !== accountId) {
    return null;
  }

  return property;
}
