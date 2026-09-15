import { prisma } from "@/lib/prisma";

/** Busca um imóvel garantindo que pertence ao usuário informado. */
export async function getOwnedProperty(propertyId: string, userId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property || property.userId !== userId) {
    return null;
  }

  return property;
}
