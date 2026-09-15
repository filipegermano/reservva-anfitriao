import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PropertyEditor } from "@/components/property/property-editor";

type PageProps = { params: Promise<{ id: string }> };

export default async function PropertyPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const property = await prisma.property.findUnique({
    where: { id },
    include: { recommendations: { orderBy: { order: "asc" } } },
  });

  if (!property || property.userId !== session!.user.id) {
    notFound();
  }

  return <PropertyEditor property={property} />;
}
