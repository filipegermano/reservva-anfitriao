import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getOwnedProperty } from "@/lib/property-access";
import { recommendationSchema } from "@/lib/validations/property";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const property = await getOwnedProperty(id, session.user.id);
  if (!property) {
    return NextResponse.json({ error: "Imóvel não encontrado" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recommendationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const count = await prisma.recommendation.count({ where: { propertyId: id } });

  const recommendation = await prisma.recommendation.create({
    data: { ...parsed.data, propertyId: id, order: count },
  });

  return NextResponse.json({ recommendation }, { status: 201 });
}
